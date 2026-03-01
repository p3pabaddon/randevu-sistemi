const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');

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

// ─── POST /api/staff  (Admin) ───────────────────────────────────────────────
router.post('/', authenticateTenant, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'İsim zorunludur.' });

    const { data, error } = await supabase
        .from('staff')
        .insert([{ tenant_id: req.tenantId, name }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ staff: data });
});

// ─── DELETE /api/staff/:id  (Admin) ──────────────────────────────────────────
router.delete('/:id', authenticateTenant, async (req, res) => {
    const { id } = req.params;

    // Sahiplik kontrolü
    const { data: existing, error: fetchErr } = await supabase.from('staff').select('tenant_id').eq('id', id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: 'Personel bulunamadı.' });
    if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkisiz işlem.' });

    const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

module.exports = router;
