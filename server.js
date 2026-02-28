require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const appointmentsRouter = require('./routes/appointments');
const tenantsRouter = require('./routes/tenants');
const servicesRouter = require('./routes/services');
const blockedSlotsRouter = require('./routes/blockedSlots');
const staffRouter = require('./routes/staff');
const { sseHandler } = require('./lib/sse');
const supabase = require('./lib/supabase');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SSE — anlık bildirim akışı
app.get('/api/sse/:tenantId', sseHandler);

// ── AUTH — Admin giriş (slug + şifre) ────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    try {
        const { slug, password } = req.body || {};
        if (!slug) return res.status(400).json({ error: 'İşletme kodu gerekli.' });
        if (!password) return res.status(400).json({ error: 'Şifre gerekli.' });

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('*, services(*)')
            .eq('slug', slug.trim().toLowerCase())
            .single();

        if (error || !tenant) {
            return res.status(404).json({ error: `İşletme bulunamadı: ${slug}` });
        }

        if (!tenant.password) {
            return res.status(503).json({ error: 'Bu işletme için henüz şifre tanımlanmamış.' });
        }

        if (password !== tenant.password) {
            return res.status(401).json({ error: 'Şifre hatalı.' });
        }

        // Şifreyi response'tan çıkar
        const { password: _pw, ...safeTenant } = tenant;
        return res.json({ tenant: safeTenant });
    } catch (err) {
        console.error('[POST /api/auth/login]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ── AUTH — Şifre Sıfırlama ───────────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { slug, newPassword } = req.body || {};
        if (!slug) return res.status(400).json({ error: 'İşletme kodu gerekli.' });
        if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Yeni şifre en az 4 karakter olmalıdır.' });

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, slug')
            .eq('slug', slug.trim().toLowerCase())
            .single();

        if (error || !tenant) {
            return res.status(404).json({ error: `İşletme bulunamadı: ${slug}` });
        }

        const { error: updateError } = await supabase
            .from('tenants')
            .update({ password: newPassword })
            .eq('id', tenant.id);

        if (updateError) return res.status(500).json({ error: 'Şifre güncellenemedi.' });

        return res.json({ success: true, message: 'Şifre başarıyla güncellendi.' });
    } catch (err) {
        console.error('[POST /api/auth/reset-password]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// API Routes
app.use('/api/appointments', appointmentsRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/blocked-slots', blockedSlotsRouter);
app.use('/api/staff', staffRouter);

// SPA fallback — her tenant slug'ı için aynı index.html döner
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n  Appointment Booking Server\n  → http://localhost:${PORT}\n`);
});

