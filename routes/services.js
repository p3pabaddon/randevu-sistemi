const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/services/:tenantId
router.get('/:tenantId', async (req, res) => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', req.params.tenantId)
        .order('name');
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ services: data });
});

// POST /api/services  — yeni hizmet ekle
router.post('/', async (req, res) => {
    const { tenant_id, name, duration_minutes, price } = req.body;
    if (!tenant_id || !name) return res.status(400).json({ error: 'tenant_id ve name zorunludur.' });
    const { data, error } = await supabase
        .from('services')
        .insert([{ tenant_id, name, duration_minutes: duration_minutes || 60, price: price || null }])
        .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ service: data });
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
    const { error } = await supabase.from('services').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

module.exports = router;
