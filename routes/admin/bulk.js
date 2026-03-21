const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// POST /api/admin/bulk/extend
router.post('/extend', async (req, res) => {
    try {
        const { tenant_ids, days } = req.body;
        if (!tenant_ids?.length || !days) return res.status(400).json({ error: 'Tenant ID listesi ve gün sayısı gerekli.' });

        let updated = 0;
        for (const tid of tenant_ids) {
            const { data: sub } = await supabase
                .from('tenant_subscriptions')
                .select('id, expires_at')
                .eq('tenant_id', tid).eq('status', 'active')
                .order('created_at', { ascending: false }).limit(1).single();

            if (sub) {
                const newExpiry = new Date(sub.expires_at);
                newExpiry.setDate(newExpiry.getDate() + parseInt(days));
                const newExpiryStr = newExpiry.toISOString().split('T')[0];

                await supabase.from('tenant_subscriptions').update({ expires_at: newExpiryStr, updated_at: new Date().toISOString() }).eq('id', sub.id);
                await supabase.from('tenants').update({ subscription_expires_at: newExpiryStr }).eq('id', tid);
                updated++;
            }
        }

        await logActivity({
            actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
            action: 'bulk.extend', details: { tenant_count: tenant_ids.length, days, updated }, ipAddress: req.ip
        });

        return res.json({ success: true, updated });
    } catch (err) {
        console.error('[Bulk Extend]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/bulk/change-plan
router.post('/change-plan', async (req, res) => {
    try {
        const { tenant_ids, plan_id, subscription_months = 1 } = req.body;
        if (!tenant_ids?.length || !plan_id) return res.status(400).json({ error: 'Tenant ID listesi ve plan ID gerekli.' });

        let updated = 0;
        for (const tid of tenant_ids) {
            await supabase.from('tenant_subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('tenant_id', tid).eq('status', 'active');

            const startsAt = new Date();
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + parseInt(subscription_months));

            await supabase.from('tenant_subscriptions').insert([{
                tenant_id: tid, plan_id, status: 'active',
                starts_at: startsAt.toISOString().split('T')[0],
                expires_at: expiresAt.toISOString().split('T')[0],
                created_by: req.adminId
            }]);

            await supabase.from('tenants').update({
                current_plan_id: plan_id,
                subscription_expires_at: expiresAt.toISOString().split('T')[0]
            }).eq('id', tid);
            updated++;
        }

        await logActivity({
            actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
            action: 'bulk.change_plan', details: { tenant_count: tenant_ids.length, plan_id, updated }, ipAddress: req.ip
        });

        return res.json({ success: true, updated });
    } catch (err) {
        console.error('[Bulk Change Plan]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/bulk/toggle-status
router.post('/toggle-status', async (req, res) => {
    try {
        const { tenant_ids, is_active } = req.body;
        if (!tenant_ids?.length || is_active === undefined) return res.status(400).json({ error: 'Tenant ID listesi ve durum gerekli.' });

        for (const tid of tenant_ids) {
            await supabase.from('tenants').update({ is_active }).eq('id', tid);
        }

        await logActivity({
            actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
            action: `bulk.${is_active ? 'enable' : 'disable'}`, details: { tenant_count: tenant_ids.length }, ipAddress: req.ip
        });

        return res.json({ success: true, updated: tenant_ids.length });
    } catch (err) {
        console.error('[Bulk Toggle]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
