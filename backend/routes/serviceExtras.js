const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');

// ─── GET /api/service-extras/:tenantId  ─────────────────────────────────────
// Retrieve all extra services for a specific tenant
router.get('/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { data, error } = await supabase
            .from('service_extras')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return res.json({ extras: data || [] });
    } catch (err) {
        console.error('[GET /service-extras]', err);
        return res.status(500).json({ error: 'Ek hizmetler okunamadı.' });
    }
});

// ─── POST /api/service-extras ─────────────────────────────────────────────
// Create a new extra service (Tenant Only)
router.post('/', authenticateTenant, async (req, res) => {
    try {
        const { service_id, name, price, duration_minutes } = req.body;
        const tenant_id = req.tenantId;

        if (!service_id || !name) {
            return res.status(400).json({ error: 'Eksik bilgi (hizmet ve ad gerekli).' });
        }

        const { data, error } = await supabase
            .from('service_extras')
            .insert([{ tenant_id, service_id, name, price: price || 0, duration_minutes: duration_minutes || 0 }])
            .select()
            .single();

        if (error) throw error;
        return res.status(201).json({ success: true, extra: data });
    } catch (err) {
        console.error('[POST /service-extras]', err);
        return res.status(500).json({ error: 'Ek hizmet oluşturulamadı.' });
    }
});

// ─── PUT /api/service-extras/:id ──────────────────────────────────────────
// Update an existing extra service (Tenant Only)
router.put('/:id', authenticateTenant, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, duration_minutes } = req.body;

        const { data: existing, error: fetchErr } = await supabase
            .from('service_extras')
            .select('tenant_id')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) return res.status(404).json({ error: 'Ek hizmet bulunamadı.' });
        if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkiniz yok.' });

        const { data, error } = await supabase
            .from('service_extras')
            .update({ name, price: price || 0, duration_minutes: duration_minutes || 0 })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.json({ success: true, extra: data });
    } catch (err) {
        console.error('[PUT /service-extras]', err);
        return res.status(500).json({ error: 'Ek hizmet güncellenemedi.' });
    }
});

// ─── DELETE /api/service-extras/:id ───────────────────────────────────────
// Delete an extra service (Tenant Only)
router.delete('/:id', authenticateTenant, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: existing, error: fetchErr } = await supabase
            .from('service_extras')
            .select('tenant_id')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) return res.status(404).json({ error: 'Ek hizmet bulunamadı.' });
        if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkiniz yok.' });

        const { error } = await supabase.from('service_extras').delete().eq('id', id);
        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('[DELETE /service-extras]', err);
        return res.status(500).json({ error: 'Ek hizmet silinemedi.' });
    }
});

module.exports = router;
