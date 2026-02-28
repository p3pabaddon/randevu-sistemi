const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

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

// POST /api/blocked-slots  — saati bloke et
router.post('/', async (req, res) => {
    const { tenant_id, staff_id, blocked_date, blocked_time } = req.body;
    if (!tenant_id || !blocked_date || !blocked_time) {
        return res.status(400).json({ error: 'tenant_id, blocked_date, blocked_time zorunludur.' });
    }

    // staff_id undefined veya boşsa null yap
    const finalStaffId = staff_id || null;

    const { data, error } = await supabase
        .from('blocked_slots')
        .insert([{ tenant_id, staff_id: finalStaffId, blocked_date, blocked_time }])
        .select().single();

    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Bu saat zaten bloke.' });
        return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ slot: data });
});

// DELETE /api/blocked-slots — blokeyi kaldır
router.delete('/', async (req, res) => {
    const { tenant_id, staff_id, blocked_date, blocked_time } = req.body;

    // Eğer staff_id varsa onu kullan, yoksa null olanı sil
    const finalStaffId = staff_id || null;

    let query = supabase
        .from('blocked_slots')
        .delete()
        .eq('tenant_id', tenant_id)
        .eq('blocked_date', blocked_date)
        .eq('blocked_time', blocked_time);

    if (finalStaffId) {
        query = query.eq('staff_id', finalStaffId);
    } else {
        query = query.is('staff_id', null);
    }

    const { error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

module.exports = router;
