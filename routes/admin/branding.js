const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// GET /api/admin/branding/:tenantId
router.get('/:tenantId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('id, name, slug, brand_logo_url, brand_primary_color, brand_secondary_color')
            .eq('id', req.params.tenantId)
            .single();

        if (error || !data) return res.status(404).json({ error: 'İşletme bulunamadı.' });
        return res.json({ branding: data });
    } catch (err) {
        console.error('[Get Branding]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// PATCH /api/admin/branding/:tenantId
router.patch('/:tenantId', async (req, res) => {
    try {
        const allowed = ['brand_logo_url', 'brand_primary_color', 'brand_secondary_color'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok.' });

        const { data, error } = await supabase.from('tenants').update(updates).eq('id', req.params.tenantId).select('id, name, brand_logo_url, brand_primary_color, brand_secondary_color').single();
        if (error) throw error;

        await logActivity({
            actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
            action: 'branding.updated', targetType: 'tenant', targetId: req.params.tenantId,
            details: updates, ipAddress: req.ip
        });

        return res.json({ branding: data });
    } catch (err) {
        console.error('[Update Branding]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
