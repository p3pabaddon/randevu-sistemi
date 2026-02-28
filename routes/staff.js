const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// ─── GET /api/staff/:tenantId ────────────────────────────────────────────────
router.get('/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ staff: data });
});

// ─── POST /api/staff ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { tenant_id, name } = req.body;
    if (!tenant_id || !name) return res.status(400).json({ error: 'tenant_id ve name zorunludur.' });

    const { data, error } = await supabase
        .from('staff')
        .insert([{ tenant_id, name }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ staff: data });
});

// ─── DELETE /api/staff/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

module.exports = router;
