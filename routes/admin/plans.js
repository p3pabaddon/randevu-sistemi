const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// GET /api/admin/plans
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return res.json({ plans: data });
    } catch (err) {
        console.error('[Admin Plans List]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// PATCH /api/admin/plans/:id
router.patch('/:id', async (req, res) => {
    try {
        const allowed = ['name', 'price_monthly', 'features', 'max_staff', 'max_branches', 'is_active', 'sort_order'];
        const updates = { updated_at: new Date().toISOString() };
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        const { data, error } = await supabase
            .from('subscription_plans')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'plan.updated',
            targetType: 'plan',
            targetId: req.params.id,
            details: updates,
            ipAddress: req.ip
        });

        return res.json({ plan: data });
    } catch (err) {
        console.error('[Admin Update Plan]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
