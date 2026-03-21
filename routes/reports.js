const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');
const { requireFeature } = require('../middleware/featureGate');

// GET /api/reports/staff/:tenantId — Personel performans raporu
router.get('/staff/:tenantId', authenticateTenant, requireFeature('advanced_reports'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        if (tenantId !== req.tenantId) return res.status(403).json({ error: 'Erişim reddedildi.' });

        const { period } = req.query; // 'week' | 'month' | 'all'
        let dateFilter = null;
        const now = new Date();
        if (period === 'week') {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            dateFilter = d.toISOString().slice(0, 10);
        } else if (period === 'month') {
            const d = new Date(now);
            d.setMonth(d.getMonth() - 1);
            dateFilter = d.toISOString().slice(0, 10);
        }

        // Tüm staff'ı al
        const { data: staffList } = await supabase
            .from('staff').select('id, name').eq('tenant_id', tenantId);

        // Randevuları çek
        let apptQuery = supabase.from('appointments')
            .select('id, staff_id, status, appointment_date, services(price, discounted_price), appointment_extras(price_at_booking)')
            .eq('tenant_id', tenantId);

        if (dateFilter) apptQuery = apptQuery.gte('appointment_date', dateFilter);

        const { data: appts, error } = await apptQuery;
        if (error) throw error;

        // Her personel için aggregation
        const staffMap = {};
        (staffList || []).forEach(s => {
            staffMap[s.id] = {
                id: s.id,
                name: s.name,
                total_appointments: 0,
                confirmed_appointments: 0,
                cancelled_appointments: 0,
                total_revenue: 0,
            };
        });

        // "Farketmez (Herhangi Biri)" için ayri satir
        staffMap['__others__'] = {
            id: '__others__',
            name: 'Farketmez (Herhangi Biri)',
            total_appointments: 0,
            confirmed_appointments: 0,
            cancelled_appointments: 0,
            total_revenue: 0,
        };

        for (const appt of appts) {
            const key = appt.staff_id && staffMap[appt.staff_id] ? appt.staff_id : '__others__';
            if (!staffMap[key]) continue;
            const s = staffMap[key];

            s.total_appointments++;
            if (appt.status === 'confirmed') {
                s.confirmed_appointments++;
                const svc = appt.services || {};
                const basePrice = svc.discounted_price != null ? Number(svc.discounted_price) : Number(svc.price || 0);
                const extrasPrice = (appt.appointment_extras || []).reduce((acc, ex) => acc + Number(ex.price_at_booking || 0), 0);
                s.total_revenue += (basePrice + extrasPrice);
            } else if (appt.status === 'cancelled') {
                s.cancelled_appointments++;
            }
        }

        const report = Object.values(staffMap)
            .filter(s => s.total_appointments > 0)
            .sort((a, b) => b.total_revenue - a.total_revenue);

        const totalRevenue = report.reduce((sum, s) => sum + s.total_revenue, 0);
        report.forEach(s => {
            s.revenue_share = totalRevenue > 0 ? Math.round((s.total_revenue / totalRevenue) * 100) : 0;
            s.cancel_rate = s.total_appointments > 0
                ? Math.round((s.cancelled_appointments / s.total_appointments) * 100)
                : 0;
        });

        return res.json({ report, totalRevenue });
    } catch (err) {
        console.error('[GET /reports/staff]', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
