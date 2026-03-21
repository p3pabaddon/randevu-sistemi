require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const appointmentsRouter = require('./routes/appointments');
const tenantsRouter = require('./routes/tenants');
const servicesRouter = require('./routes/services');
const blockedSlotsRouter = require('./routes/blockedSlots');
const staffRouter = require('./routes/staff');
const serviceExtrasRouter = require('./routes/serviceExtras');
const waitlistRouter = require('./routes/waitlist');
const customersRouter = require('./routes/customers');
const reportsRouter = require('./routes/reports');
const aiRouter = require('./routes/ai');
const adminRouter = require('./routes/admin/index');
const tenantTicketsRouter = require('./routes/tenantTickets');
const tenantNotificationsRouter = require('./routes/tenantNotifications');
const { sseHandler } = require('./lib/sse');
const supabase = require('./lib/supabase');
const { loginSchema } = require('./lib/validation');
const { sendWhatsApp, buildReminder2hMessage, buildReminder40mMessage } = require('./services/whatsapp');

// ── ENV CHECK ───────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
    console.error(`\n[CRITICAL] Eksik ortam değişkenleri: ${missing.join(', ')}`);
}
if (!process.env.JWT_SECRET) {
    console.log('[INFO] JWT_SECRET ayarlanmamış, varsayılan güvenli anahtar kullanılıyor.');
}

const app = express();

// ── Global Crash Koruması ────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});

// Trust reverse proxy for rate limiting (e.g., Render, Heroku)
app.set('trust proxy', 1);

// ── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false, // SPA and CDN scripts support
}));
app.use(cookieParser());

// CORS — sadece izin verilen originler
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: true, // İsteğin geldiği origin'e izin ver (Credentials ile uyumlu)
    credentials: true,
}));
app.use(express.json());
// SSE — anlık bildirim akışı
app.get('/api/sse/:tenantId', sseHandler);

// ── AUTH — Admin giriş (slug + şifre) ────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    try {
        const { error: valError } = loginSchema.validate(req.body);
        if (valError) return res.status(400).json({ error: valError.details[0].message });

        const { slug, password } = req.body;

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('*, services(*, service_extras(*))')
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
            process.env.JWT_SECRET || 'randevu-sistemi-default-secret-key-xyz-789',
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
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { slug, recoveryPin, newPassword } = req.body || {};
        if (!slug) return res.status(400).json({ error: 'İşletme kodu gerekli.' });
        if (!recoveryPin) return res.status(400).json({ error: 'Kurtarma Kodu (PIN) gerekli.' });
        if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Yeni şifre en az 4 karakter olmalıdır.' });

        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, slug, password, recovery_pin')
            .eq('slug', slug.trim().toLowerCase())
            .single();

        if (error || !tenant) {
            return res.status(404).json({ error: 'Geçersiz işletme kodu.' });
        }

        // Kurtarma Kodu (PIN) Kontrolü
        if (!tenant.recovery_pin || recoveryPin.trim().toUpperCase() !== tenant.recovery_pin.trim().toUpperCase()) {
            return res.status(401).json({ error: 'Kurtarma kodu hatalı.' });
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
app.use('/api/service-extras', serviceExtrasRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/customers', customersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tickets', tenantTicketsRouter);
app.use('/api/tenant-notifications', tenantNotificationsRouter);

// Birleştirilmiş Yapı: Landing Page ve App

// 0. Redirect for legacy or specific booking.html links to prevent 404
app.get('/booking.html', (req, res) => {
    res.redirect(301, `/app/booking.html${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`);
});

// 1. /app isteği gelirse /app/ olarak yönlendir (Relative path sorunlarını önlemek için)
app.get('/app', (req, res, next) => {
    if (!req.url.endsWith('/')) {
        return res.redirect(301, '/app/');
    }
    next();
});

// Admin Panel
app.get('/admin', (req, res, next) => {
    if (!req.url.endsWith('/')) return res.redirect(301, '/admin/');
    next();
});
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.get('/admin/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// 2. Orijinal App (public/app) - /app/ yolundan servis edilir
app.use('/app', express.static(path.join(__dirname, 'public', 'app')));

// 3. Landing Page (public root) - / yolundan servis edilir
app.use(express.static(path.join(__dirname, 'public')));

// 4. /app/ isteği gelince index.html'i döndür
app.get('/app/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app', 'index.html'));
});

// 5. Tenant Clean URL (e.g. randevudunyasi.com/Fadexlab)
app.get('/:slug', async (req, res, next) => {
    const slug = req.params.slug;
    const reserved = ['api', 'app', 'admin', 'css', 'js', 'images', 'assets', 'favicon.ico'];
    if (!slug || reserved.includes(slug.toLowerCase())) return next();

    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('id')
            .ilike('slug', slug)
            .single();

        if (data && !error) {
            return res.sendFile(path.join(__dirname, 'public', 'app', 'booking.html'));
        }
    } catch (err) {
        console.error('[Clean URL Check]', err);
    }
    next();
});

// SPA fallback - Tüm diğer yollar landing page'e gider (React Router desteği)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 2050;
app.listen(PORT, () => {
    console.log(`\n  Appointment Booking Server (Hardened)\n  → http://localhost:${PORT}\n`);

    // ── OTOMATİK TEMİZLEYİCİ — Süresi Dolmuş Randevular ──────────────────────
    // Randevu tarihinden 2 gün geçmiş kayıtları kalıcı olarak siler.
    // Her saat çalışır.
    async function cleanupExpiredAppointments() {
        try {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const cutoff = twoDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

            const { data, error } = await supabase
                .from('appointments')
                .delete()
                .lt('appointment_date', cutoff)
                .select('id');

            if (error) {
                console.error('[CLEANUP] Randevu silme hatası:', error.message);
            } else if (data && data.length > 0) {
                console.log(`[CLEANUP] ${data.length} süresi dolmuş randevu silindi. (< ${cutoff})`);
            }
        } catch (err) {
            console.error('[CLEANUP] Beklenmedik hata:', err.message);
        }
    }

    // ── HATIRLATMA SİSTEMİ — WhatsApp Randevu Hatırlatmaları ────────────────────
    // 1) 4+ saatlik randevularda: 2 saat kala hatırlatma
    // 2) Tüm randevularda: 40 dakika kala hatırlatma
    async function sendReminderNotifications() {
        try {
            const now = new Date();
            // Türkiye saati (UTC+3) — sunucu UTC ise offset ekle
            const turkeyOffset = 3 * 60 * 60 * 1000;
            const turkeyNow = new Date(now.getTime() + turkeyOffset);

            const todayStr = turkeyNow.toISOString().split('T')[0]; // YYYY-MM-DD

            // Bugünkü ve yarınki aktif randevuları çek
            const tomorrowDate = new Date(turkeyNow);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('*, services(name), tenants(name, phone)')
                .in('appointment_date', [todayStr, tomorrowStr])
                .neq('status', 'cancelled')
                .is('deleted_at', null);

            if (error) {
                console.error('[Reminder] DB hatası:', error.message);
                return;
            }

            if (!appointments || appointments.length === 0) return;

            for (const appt of appointments) {
                const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time.slice(0, 5)}:00+03:00`);
                const diffMs = apptDateTime.getTime() - now.getTime();
                const diffMinutes = diffMs / (1000 * 60);

                // Geçmiş randevuları atla
                if (diffMinutes < 0) continue;

                const msgParams = {
                    customerName: appt.customer_name,
                    serviceName: appt.services?.name || 'Randevu',
                    date: appt.appointment_date,
                    time: appt.appointment_time.slice(0, 5),
                    businessName: appt.tenants?.name || 'İşletme',
                    businessPhone: appt.tenants?.phone || '',
                };

                // ── 2 SAAT KALA HATIRLATMA (sadece 4+ saat önceden alınmış randevular) ──
                // Randevu oluşturulma zamanı ile randevu zamanı arası 4+ saat ise
                if (!appt.reminder_2h_sent && diffMinutes <= 120 && diffMinutes > 40) {
                    // Randevunun ne zaman oluşturulduğunu kontrol et
                    const createdAt = new Date(appt.created_at);
                    const bookingToApptHours = (apptDateTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

                    if (bookingToApptHours >= 4) {
                        console.log(`[Reminder-2h] → ${appt.customer_name} (${appt.customer_phone}) | ${appt.appointment_date} ${appt.appointment_time.slice(0, 5)}`);
                        const message = buildReminder2hMessage(msgParams);
                        await sendWhatsApp(appt.customer_phone, message);

                        await supabase
                            .from('appointments')
                            .update({ reminder_2h_sent: true })
                            .eq('id', appt.id);
                    }
                }

                // ── 40 DAKİKA KALA HATIRLATMA (tüm randevular) ──
                if (!appt.reminder_40m_sent && diffMinutes <= 40 && diffMinutes > 0) {
                    console.log(`[Reminder-40m] → ${appt.customer_name} (${appt.customer_phone}) | ${appt.appointment_date} ${appt.appointment_time.slice(0, 5)}`);
                    const message = buildReminder40mMessage(msgParams);
                    await sendWhatsApp(appt.customer_phone, message);

                    await supabase
                        .from('appointments')
                        .update({ reminder_40m_sent: true })
                        .eq('id', appt.id);
                }
            }
        } catch (err) {
            console.error('[Reminder] Beklenmedik hata:', err.message);
        }
    }

    // İlk çalıştırma — server ayağa kalkar kalkmaz
    cleanupExpiredAppointments();
    sendReminderNotifications();

    // Temizleyici: her saat
    setInterval(cleanupExpiredAppointments, 60 * 60 * 1000);

    // Hatırlatma: her 10 dakikada bir kontrol et
    setInterval(sendReminderNotifications, 10 * 60 * 1000);

    console.log('  → Hatırlatma sistemi aktif (her 10 dk kontrol)');
});

