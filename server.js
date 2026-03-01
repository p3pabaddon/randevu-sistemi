require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const appointmentsRouter = require('./routes/appointments');
const tenantsRouter = require('./routes/tenants');
const servicesRouter = require('./routes/services');
const blockedSlotsRouter = require('./routes/blockedSlots');
const staffRouter = require('./routes/staff');
const { sseHandler } = require('./lib/sse');
const supabase = require('./lib/supabase');
const { loginSchema } = require('./lib/validation');

// ── ENV CHECK ───────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
    console.error(`\n[CRITICAL] Eksik ortam değişkenleri: ${missing.join(', ')}`);
    console.error('Lütfen .env dosyasını veya deploy ayarlarını kontrol edin.\n');
}

const app = express();

// ── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false, // SPA and CDN scripts support
}));
app.use(cookieParser());

// Global API Rate Limit: Saniyede çok fazla isteği engellemek için
const globalLimiter = (req, res, next) => next();
app.use('/api/', globalLimiter);

// Auth Rate Limit: Daha sıkı (Giriş denemeleri için)
const authLimiter = (req, res, next) => next();

// Reset Password Rate Limit
const resetLimiter = (req, res, next) => next();

// CORS — sadece izin verilen originler
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: true, // İsteğin geldiği origin'e izin ver (Credentials ile uyumlu)
    credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SSE — anlık bildirim akışı
app.get('/api/sse/:tenantId', sseHandler);

// ── AUTH — Admin giriş (slug + şifre) ────────────────────────────────────────
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { error: valError } = loginSchema.validate(req.body);
        if (valError) return res.status(400).json({ error: valError.details[0].message });

        const { slug, password } = req.body;

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('*, services(*)')
            .eq('slug', slug.trim().toLowerCase())
            .single();

        if (error || !tenant) {
            return res.status(401).json({ error: 'Geçersiz işletme kodu veya şifre.' });
        }

        if (!tenant.password) {
            return res.status(503).json({ error: 'Bu işletme için henüz şifre tanımlanmamış.' });
        }

        // Şifre kontrolü (Migration desteğiyle)
        let isMatch = false;
        const isHashed = tenant.password.startsWith('$2a$') || tenant.password.startsWith('$2b$');

        if (isHashed) {
            isMatch = await bcrypt.compare(password, tenant.password);
        } else {
            // Legacy plaintext match
            isMatch = (password === tenant.password);
            if (isMatch) {
                // Şifreyi hemen hashle ve güncelle (Auto migration)
                const hashed = await bcrypt.hash(password, 10);
                await supabase.from('tenants').update({ password: hashed }).eq('id', tenant.id);
                console.log(`[AUTH] Migrated password for tenant: ${tenant.slug}`);
            }
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'Geçersiz işletme kodu veya şifre.' });
        }

        // JWT Oluştur
        const token = jwt.sign(
            { tenantId: tenant.id, tenantSlug: tenant.slug },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Cookie olarak ayarla
        res.cookie('randevu_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
        });

        const { password: _pw, ...safeTenant } = tenant;
        return res.json({ tenant: safeTenant });
    } catch (err) {
        console.error('[POST /api/auth/login]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ── AUTH — Şifre Sıfırlama (Mevcut şifre doğrulaması gerekli) ───────────────
app.post('/api/auth/reset-password', resetLimiter, async (req, res) => {
    try {
        const { slug, currentPassword, newPassword } = req.body || {};
        if (!slug) return res.status(400).json({ error: 'İşletme kodu gerekli.' });
        if (!currentPassword) return res.status(400).json({ error: 'Mevcut şifre gerekli.' });
        if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Yeni şifre en az 4 karakter olmalıdır.' });

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, slug, password')
            .eq('slug', slug.trim().toLowerCase())
            .single();

        if (error || !tenant) {
            return res.status(404).json({ error: 'Geçersiz işletme kodu veya şifre.' });
        }

        // Mevcut şifreyi doğrula
        const isHashed = tenant.password?.startsWith('$2a$') || tenant.password?.startsWith('$2b$');
        let isMatch = false;
        if (isHashed) {
            isMatch = await bcrypt.compare(currentPassword, tenant.password);
        } else {
            isMatch = (currentPassword === tenant.password);
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'Mevcut şifre hatalı.' });
        }

        // Yeni şifreyi hashle
        const hashed = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('tenants')
            .update({ password: hashed })
            .eq('id', tenant.id);

        if (updateError) return res.status(500).json({ error: 'Şifre güncellenemedi.' });

        return res.json({ success: true, message: 'Şifre başarıyla güncellendi.' });
    } catch (err) {
        console.error('[POST /api/auth/reset-password]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ── AUTH — Çıkış Yap ─────────────────────────────────────────────────────────
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('randevu_token');
    return res.json({ success: true });
});

// API Routes
app.use('/api/appointments', appointmentsRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/blocked-slots', blockedSlotsRouter);
app.use('/api/staff', staffRouter);

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n  Appointment Booking Server (Hardened)\n  → http://localhost:${PORT}\n`);
});

