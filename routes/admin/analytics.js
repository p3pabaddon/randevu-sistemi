const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');

// GET /api/admin/analytics/overview
router.get('/overview', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [tenantsRes, activeTenantsRes, apptsAllRes, apptsTodayRes, plansRes, paymentsRes] = await Promise.all([
            supabase.from('tenants').select('id', { count: 'exact', head: true }),
            supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).is('deleted_at', null),
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today).is('deleted_at', null),
            supabase.from('subscription_plans').select('id, name, slug'),
            supabase.from('payments').select('amount, status').eq('status', 'paid')
        ]);

        // Abonelik dagilimi
        const distribution = {};
        if (plansRes.data) {
            for (const plan of plansRes.data) {
                const { count } = await supabase
                    .from('tenants')
                    .select('id', { count: 'exact', head: true })
                    .eq('current_plan_id', plan.id);
                distribution[plan.slug] = { name: plan.name, count: count || 0 };
            }
        }

        // Plansiz tenant sayisi
        const { count: noPlanCount } = await supabase
            .from('tenants')
            .select('id', { count: 'exact', head: true })
            .is('current_plan_id', null);
        distribution['plansiz'] = { name: 'Plansız', count: noPlanCount || 0 };

        // Toplam gelir
        const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

        // Bu ayin geliri
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const { data: monthPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'paid')
            .gte('payment_date', thisMonth + '-01')
            .lte('payment_date', thisMonth + '-31');

        const monthlyRevenue = (monthPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

        return res.json({
            total_tenants: tenantsRes.count || 0,
            active_tenants: activeTenantsRes.count || 0,
            total_appointments: apptsAllRes.count || 0,
            today_appointments: apptsTodayRes.count || 0,
            total_revenue: totalRevenue,
            monthly_revenue: monthlyRevenue,
            subscription_distribution: distribution
        });
    } catch (err) {
        console.error('[Admin Analytics Overview]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/analytics/growth
router.get('/growth', async (req, res) => {
    try {
        const { months = 6 } = req.query;
        const now = new Date();
        const result = [];

        for (let i = parseInt(months) - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
            const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

            const [newTenants, newAppts] = await Promise.all([
                supabase.from('tenants').select('id', { count: 'exact', head: true })
                    .gte('created_at', monthStart).lt('created_at', monthEnd),
                supabase.from('appointments').select('id', { count: 'exact', head: true })
                    .gte('created_at', monthStart).lt('created_at', monthEnd).is('deleted_at', null)
            ]);

            result.push({
                month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                new_tenants: newTenants.count || 0,
                new_appointments: newAppts.count || 0
            });
        }

        return res.json({ growth: result });
    } catch (err) {
        console.error('[Admin Analytics Growth]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/analytics/top-tenants
router.get('/top-tenants', async (req, res) => {
    try {
        const { by = 'appointments', limit = 10 } = req.query;

        const { data: tenants } = await supabase
            .from('tenants')
            .select('id, name, slug, current_plan_id');

        if (!tenants || tenants.length === 0) return res.json({ top_tenants: [] });

        const results = await Promise.all(tenants.map(async (t) => {
            if (by === 'revenue') {
                const { data } = await supabase.from('payments').select('amount').eq('tenant_id', t.id).eq('status', 'paid');
                const revenue = (data || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
                return { ...t, value: revenue };
            } else {
                const { count } = await supabase.from('appointments').select('id', { count: 'exact', head: true })
                    .eq('tenant_id', t.id).is('deleted_at', null);
                return { ...t, value: count || 0 };
            }
        }));

        results.sort((a, b) => b.value - a.value);
        return res.json({ top_tenants: results.slice(0, parseInt(limit)) });
    } catch (err) {
        console.error('[Admin Top Tenants]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/analytics/usage — Kullanım metrikleri
router.get('/usage', async (req, res) => {
    try {
        const { data: tenants } = await supabase
            .from('tenants')
            .select('id, name, slug, current_plan_id');

        if (!tenants || tenants.length === 0) return res.json({ usage: [] });

        const results = await Promise.all(tenants.map(async (t) => {
            const [appts, services, staff] = await Promise.all([
                supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id).is('deleted_at', null),
                supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
                supabase.from('staff').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id)
            ]);

            return {
                id: t.id, name: t.name, slug: t.slug,
                appointments: appts.count || 0,
                services: services.count || 0,
                staff: staff.count || 0
            };
        }));

        // Özet: kaç tenant her özelliği aktif kullanıyor
        const summary = {
            with_appointments: results.filter(r => r.appointments > 0).length,
            with_services: results.filter(r => r.services > 0).length,
            with_staff: results.filter(r => r.staff > 0).length,
            total: results.length
        };

        return res.json({ usage: results, summary });
    } catch (err) {
        console.error('[Admin Usage Metrics]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
