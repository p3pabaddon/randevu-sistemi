const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

// Kayıt spam koruması: 1 saatte en fazla 10 yeni işletme
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Çok fazla kayıt denemesi. Lütfen bir saat bekleyin.' }
});

// password alanını nesneden çıkaran yardımcı
function stripPassword(obj) {
    if (!obj) return obj;
    const { password: _pw, ...safe } = obj;
    return safe;
}

function generateRecoveryPin() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── GET /api/tenants ─────────────────────────────────────────────────────────
// Genel liste (Dashboard'da bazen gerekebilir)
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('tenants').select('id, name, slug, phone').order('name');
    if (error) return res.status(500).json({ error: 'Veriler alınamadı.' });
    return res.json({ tenants: data || [] });
});

// ─── GET /api/tenants/:slug ───────────────────────────────────────────────────
// Booking sayfası için halka açık
router.get('/:slug', async (req, res) => {
    const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, phone, email, address, whatsapp_number, services(*, service_extras(*))')
        .eq('slug', req.params.slug)
        .single();
    if (error) return res.status(404).json({ error: 'İşletme bulunamadı.' });
    return res.json({ tenant: data });
});

// ─── POST /api/tenants ────────────────────────────────────────────────────────
// Yeni işletme kaydı
router.post('/', registerLimiter, async (req, res) => {
    const { name, slug, phone, email, address, whatsapp_number, password } = req.body;
    if (!name || !slug || !password) return res.status(400).json({ error: 'Eksik bilgi.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const recoveryPin = generateRecoveryPin();

    const { data, error } = await supabase
        .from('tenants')
        .insert([{ name, slug, phone, email, address, whatsapp_number, password: hashedPassword, recovery_pin: recoveryPin }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Bu işletme kodu zaten kullanımda.' });
        return res.status(500).json({ error: 'Kayıt başarısız.' });
    }
    return res.status(201).json({ tenant: stripPassword(data) });
});

// ─── PATCH /api/tenants/:id ───────────────────────────────────────────────────
// Bilgileri güncelleme (Sadece giriş yapmış işletme kendi bilgisini günceller)
router.patch('/:id', authenticateTenant, async (req, res) => {
    const { id } = req.params;
    if (id !== req.tenantId) return res.status(403).json({ error: 'Yetkisiz işlem.' });

    const allowed = ['name', 'phone', 'email', 'address', 'whatsapp_number', 'password'];
    const updates = {};

    for (const k of allowed) {
        if (req.body[k] !== undefined) {
            if (k === 'password') {
                updates[k] = await bcrypt.hash(req.body[k], 10);
            } else {
                updates[k] = req.body[k];
            }
        }
    }

    const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: 'Güncellenemedi.' });
    return res.json({ tenant: stripPassword(data) });
});

module.exports = router;
