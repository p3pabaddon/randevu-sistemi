const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');

// GET /api/admin/subscriptions
router.get('/', async (req, res) => {
    try {
        const { status, plan, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('tenant_subscriptions')
            .select('*, tenants(id, name, slug, phone, email), subscription_plans(id, name, slug, price_monthly)', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (plan) query = query.eq('plan_id', plan);

        query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({
            subscriptions: data,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil((count || 0) / parseInt(limit))
        });
    } catch (err) {
        console.error('[Admin Subscriptions]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/subscriptions/expiring
router.get('/expiring', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));

        const { data, error } = await supabase
            .from('tenant_subscriptions')
            .select('*, tenants(id, name, slug, phone, email), subscription_plans(id, name, slug)')
            .eq('status', 'active')
            .lte('expires_at', futureDate.toISOString().split('T')[0])
            .gte('expires_at', new Date().toISOString().split('T')[0])
            .order('expires_at', { ascending: true });

        if (error) throw error;
        return res.json({ expiring: data });
    } catch (err) {
        console.error('[Admin Expiring Subs]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
