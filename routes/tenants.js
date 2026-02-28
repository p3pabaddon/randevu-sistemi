const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// password alanını nesneden çıkaran yardımcı
function stripPassword(obj) {
    if (!obj) return obj;
    const { password: _pw, ...safe } = obj;
    return safe;
}

// ─── GET /api/tenants ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('tenants').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ tenants: (data || []).map(stripPassword) });
});

// ─── GET /api/tenants/:slug ───────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
    const { data, error } = await supabase
        .from('tenants')
        .select('*, services(*)')
        .eq('slug', req.params.slug)
        .single();
    if (error) return res.status(404).json({ error: 'İşletme bulunamadı.' });
    return res.json({ tenant: stripPassword(data) });
});

// ─── POST /api/tenants ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { name, slug, phone, email, address, whatsapp_number, password } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name ve slug zorunludur.' });

    const { data, error } = await supabase
        .from('tenants')
        .insert([{ name, slug, phone, email, address, whatsapp_number, password: password || null }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Bu slug zaten kullanımda.' });
        return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ tenant: stripPassword(data) });
});

// ─── PATCH /api/tenants/:id ───────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
    const allowed = ['name', 'phone', 'email', 'address', 'whatsapp_number', 'password'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ tenant: stripPassword(data) });
});

module.exports = router;
