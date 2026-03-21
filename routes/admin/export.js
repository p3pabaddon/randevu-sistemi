const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');

// GET /api/admin/export/tenants
router.get('/tenants', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tenants')
            .select('name, slug, phone, email, address, whatsapp_number, is_active, subscription_expires_at, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const headers = ['İsim', 'Slug', 'Telefon', 'E-posta', 'Adres', 'WhatsApp', 'Aktif', 'Abonelik Bitiş', 'Kayıt Tarihi'];
        const rows = (data || []).map(t => [
            t.name, t.slug, t.phone || '', t.email || '', t.address || '',
            t.whatsapp_number || '', t.is_active ? 'Evet' : 'Hayır',
            t.subscription_expires_at || '', t.created_at?.split('T')[0] || ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=isletmeler.csv');
        return res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    } catch (err) {
        console.error('[Export Tenants]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/export/payments
router.get('/payments', async (req, res) => {
    try {
        const { from, to } = req.query;
        let query = supabase.from('payments').select('*, tenants(name, slug)').order('created_at', { ascending: false });
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to + 'T23:59:59');

        const { data, error } = await query;
        if (error) throw error;

        const headers = ['İşletme', 'Tutar', 'Para Birimi', 'Yöntem', 'Durum', 'Ödeme Tarihi', 'Vade', 'Fatura No', 'Notlar'];
        const rows = (data || []).map(p => [
            p.tenants?.name || '', p.amount, p.currency, p.payment_method, p.status,
            p.payment_date || '', p.due_date || '', p.invoice_number || '', p.notes || ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=odemeler.csv');
        return res.send('\uFEFF' + csv);
    } catch (err) {
        console.error('[Export Payments]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/export/report — Denetim raporu (JSON, frontend PDF'e çevirir)
router.get('/report', async (req, res) => {
    try {
        const { tenant_id, from, to } = req.query;
        if (!tenant_id) return res.status(400).json({ error: 'Tenant ID gerekli.' });

        const { data: tenant } = await supabase.from('tenants').select('name, slug, phone, email, created_at').eq('id', tenant_id).single();

        let apptQuery = supabase.from('appointments').select('*, services(name)').eq('tenant_id', tenant_id).is('deleted_at', null);
        if (from) apptQuery = apptQuery.gte('appointment_date', from);
        if (to) apptQuery = apptQuery.lte('appointment_date', to);
        const { data: appointments } = await apptQuery.order('appointment_date', { ascending: false });

        const { data: payments } = await supabase.from('payments').select('*').eq('tenant_id', tenant_id).order('created_at', { ascending: false });

        const { data: subscriptions } = await supabase
            .from('tenant_subscriptions').select('*, subscription_plans(name)')
            .eq('tenant_id', tenant_id).order('created_at', { ascending: false });

        const { data: logs } = await supabase
            .from('activity_logs').select('*').eq('target_id', tenant_id)
            .order('created_at', { ascending: false }).limit(50);

        // İstatistikler
        const totalAppts = (appointments || []).length;
        const confirmedAppts = (appointments || []).filter(a => a.status === 'confirmed').length;
        const totalRevenue = (payments || []).filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount), 0);

        return res.json({
            tenant,
            period: { from: from || 'Tümü', to: to || 'Tümü' },
            stats: { total_appointments: totalAppts, confirmed_appointments: confirmedAppts, total_revenue: totalRevenue },
            appointments: (appointments || []).slice(0, 100),
            payments: payments || [],
            subscriptions: subscriptions || [],
            activity_logs: logs || [],
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('[Export Report]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
