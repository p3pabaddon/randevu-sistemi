const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');

// GET /api/waitlist/:tenantId — Bekleme listesi
router.get('/:tenantId', authenticateTenant, async (req, res) => {
    try {
        const { tenantId } = req.params;
        if (tenantId !== req.tenantId) return res.status(403).json({ error: 'Erişim reddedildi.' });

        const { data, error } = await supabase
            .from('waitlist')
            .select('*, services(name)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.json({ waitlist: data });
    } catch (err) {
        console.error('[GET /waitlist]', err);
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/waitlist — Yeni bekleme kaydı (herkese açık)
router.post('/', async (req, res) => {
    try {
        const { tenant_id, customer_name, customer_phone, requested_date, requested_time, service_id, notes } = req.body;
        if (!tenant_id || !customer_name || !customer_phone || !requested_date || !requested_time) {
            return res.status(400).json({ error: 'Ad, telefon, tarih ve saat zorunludur.' });
        }

        const { data, error } = await supabase
            .from('waitlist')
            .insert([{ tenant_id, customer_name, customer_phone, requested_date, requested_time, service_id: service_id || null, notes: notes || null }])
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json({ success: true, entry: data });
    } catch (err) {
        console.error('[POST /waitlist]', err);
        return res.status(500).json({ error: err.message });
    }
});

// PATCH /api/waitlist/:id/status — Durum güncelle
router.patch('/:id/status', authenticateTenant, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['waiting', 'contacted', 'booked', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Geçersiz durum.' });
        }

        const { data: existing } = await supabase.from('waitlist').select('tenant_id').eq('id', id).single();
        if (!existing || existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Erişim reddedildi.' });

        const { data, error } = await supabase
            .from('waitlist').update({ status }).eq('id', id).select().single();

        if (error) throw error;
        return res.json({ success: true, entry: data });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/waitlist/:id
router.delete('/:id', authenticateTenant, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: existing } = await supabase.from('waitlist').select('tenant_id').eq('id', id).single();
        if (!existing || existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Erişim reddedildi.' });

        const { error } = await supabase.from('waitlist').delete().eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
