const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');
const { serviceSchema } = require('../lib/validation');

// GET /api/services/:tenantId (Public - Booking için)
router.get('/:tenantId', async (req, res) => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', req.params.tenantId)
        .order('name');
    if (error) return res.status(500).json({ error: 'Hizmetler alınamadı.' });
    return res.json({ services: data });
});

// POST /api/services — yeni hizmet ekle (Admin)
router.post('/', authenticateTenant, async (req, res) => {
    const { error: valError } = serviceSchema.validate(req.body);
    if (valError) return res.status(400).json({ error: valError.details[0].message });

    const { name, duration_minutes, price, discounted_price } = req.body;

    const { data, error } = await supabase
        .from('services')
        .insert([{
            tenant_id: req.tenantId,
            name,
            duration_minutes: duration_minutes || 60,
            price: price || null,
            discounted_price: discounted_price || null
        }])
        .select().single();

    if (error) return res.status(500).json({ error: 'Hizmet eklenemedi.' });
    return res.status(201).json({ service: data });
});

// PUT /api/services/:id — hizmeti güncelle (Admin)
router.put('/:id', authenticateTenant, async (req, res) => {
    const { id } = req.params;
    const { name, duration_minutes, price, discounted_price } = req.body;

    // Sahiplik kontrolü
    const { data: existing, error: fetchErr } = await supabase.from('services').select('tenant_id').eq('id', id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: 'Hizmet bulunamadı.' });
    if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkisiz işlem.' });

    const { data, error } = await supabase
        .from('services')
        .update({
            name,
            duration_minutes: duration_minutes || 60,
            price: price != null ? price : null,
            discounted_price: discounted_price != null ? discounted_price : null
        })
        .eq('id', id)
        .select().single();

    if (error) return res.status(500).json({ error: 'Güncellenemedi.' });
    return res.json({ service: data });
});

// DELETE /api/services/:id (Admin)
router.delete('/:id', authenticateTenant, async (req, res) => {
    const { id } = req.params;

    // Sahiplik kontrolü
    const { data: existing, error: fetchErr } = await supabase.from('services').select('tenant_id').eq('id', id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: 'Hizmet bulunamadı.' });
    if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkisiz işlem.' });

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Silinemedi.' });
    return res.json({ success: true });
});

module.exports = router;
