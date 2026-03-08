const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');

// GET /api/blocked-slots/:tenantId?date=YYYY-MM-DD&staff_id=xyz
router.get('/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    const { date, staff_id } = req.query;

    let query = supabase
        .from('blocked_slots')
        .select('*')
        .eq('tenant_id', tenantId);

    if (date) query = query.eq('blocked_date', date);

    // Eğer spesifik personel istendiyse, onun kapalı saatlerini VE genel (null) kapalı saatleri getir
    if (staff_id && staff_id !== 'null') {
        query = query.or(`staff_id.eq.${staff_id},staff_id.is.null`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ blocked: data });
});

// POST /api/blocked-slots — saati bloke et (Admin)
router.post('/', authenticateTenant, async (req, res) => {
    const { staff_id, blocked_date, blocked_time } = req.body;
    if (!blocked_date || !blocked_time) {
        return res.status(400).json({ error: 'Tarih ve saat zorunludur.' });
    }

    const { data, error } = await supabase
        .from('blocked_slots')
        .insert([{ tenant_id: req.tenantId, staff_id: staff_id || null, blocked_date, blocked_time }])
        .select().single();

    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Bu saat zaten bloke.' });
        return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ slot: data });
});

// DELETE /api/blocked-slots — blokeyi kaldır (Admin)
router.delete('/', authenticateTenant, async (req, res) => {
    const { staff_id, blocked_date, blocked_time } = req.body;

    let query = supabase
        .from('blocked_slots')
        .delete()
        .eq('tenant_id', req.tenantId)
        .eq('blocked_date', blocked_date)
        .eq('blocked_time', blocked_time);

    if (staff_id) {
        query = query.eq('staff_id', staff_id);
    } else {
        query = query.is('staff_id', null);
    }

    const { error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

module.exports = router;
