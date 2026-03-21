const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// GET /api/admin/payments
router.get('/', async (req, res) => {
    try {
        const { tenant_id, status, from, to, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('payments')
            .select('*, tenants(id, name, slug)', { count: 'exact' });

        if (tenant_id) query = query.eq('tenant_id', tenant_id);
        if (status) query = query.eq('status', status);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to + 'T23:59:59');

        query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({
            payments: data,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil((count || 0) / parseInt(limit))
        });
    } catch (err) {
        console.error('[Admin Payments List]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/payments
router.post('/', async (req, res) => {
    try {
        const { tenant_id, subscription_id, amount, payment_method, status, payment_date, due_date, invoice_number, notes } = req.body;

        if (!tenant_id || !amount) {
            return res.status(400).json({ error: 'Tenant ID ve tutar zorunludur.' });
        }

        const { data, error } = await supabase.from('payments').insert([{
            tenant_id,
            subscription_id: subscription_id || null,
            amount: parseFloat(amount),
            payment_method: payment_method || 'manual',
            status: status || 'pending',
            payment_date: payment_date || null,
            due_date: due_date || null,
            invoice_number: invoice_number || null,
            notes: notes || null,
            recorded_by: req.adminId
        }]).select('*, tenants(id, name, slug)').single();

        if (error) throw error;

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'payment.recorded',
            targetType: 'tenant',
            targetId: tenant_id,
            details: { amount: parseFloat(amount), payment_method, status },
            ipAddress: req.ip
        });

        return res.status(201).json({ payment: data });
    } catch (err) {
        console.error('[Admin Create Payment]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// PATCH /api/admin/payments/:id
router.patch('/:id', async (req, res) => {
    try {
        const allowed = ['status', 'payment_date', 'notes', 'payment_method', 'invoice_number'];
        const updates = { updated_at: new Date().toISOString() };
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        const { data, error } = await supabase.from('payments').update(updates).eq('id', req.params.id).select('*, tenants(id, name, slug)').single();
        if (error) throw error;

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'payment.updated',
            targetType: 'payment',
            targetId: req.params.id,
            details: updates,
            ipAddress: req.ip
        });

        return res.json({ payment: data });
    } catch (err) {
        console.error('[Admin Update Payment]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/payments/summary
router.get('/summary', async (req, res) => {
    try {
        const { data: allPayments, error } = await supabase.from('payments').select('amount, status, payment_date, created_at');
        if (error) throw error;

        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        let totalRevenue = 0, paidCount = 0, pendingCount = 0, overdueCount = 0, monthlyRevenue = 0;

        const monthlyBreakdown = {};

        (allPayments || []).forEach(p => {
            if (p.status === 'paid') {
                totalRevenue += parseFloat(p.amount);
                paidCount++;
                const month = (p.payment_date || p.created_at || '').substring(0, 7);
                if (month === thisMonth) monthlyRevenue += parseFloat(p.amount);
                if (month) {
                    monthlyBreakdown[month] = (monthlyBreakdown[month] || 0) + parseFloat(p.amount);
                }
            } else if (p.status === 'pending') {
                pendingCount++;
            } else if (p.status === 'overdue') {
                overdueCount++;
            }
        });

        // Son 6 ay kirilimi
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push({ month: key, revenue: monthlyBreakdown[key] || 0 });
        }

        return res.json({
            total_revenue: totalRevenue,
            monthly_revenue: monthlyRevenue,
            paid_count: paidCount,
            pending_count: pendingCount,
            overdue_count: overdueCount,
            monthly_breakdown: months
        });
    } catch (err) {
        console.error('[Admin Payment Summary]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/payments/send-reminders — Ödeme hatırlatma WhatsApp
router.post('/send-reminders', async (req, res) => {
    try {
        const { sendWhatsApp } = require('../../services/whatsapp');

        // Süresi 7 gün içinde dolacak aktif abonelikler
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);

        const { data: expiring } = await supabase
            .from('tenant_subscriptions')
            .select('*, tenants(name, phone, whatsapp_number, email)')
            .eq('status', 'active')
            .lte('expires_at', futureDate.toISOString().split('T')[0])
            .gte('expires_at', new Date().toISOString().split('T')[0]);

        let sentCount = 0;
        for (const sub of (expiring || [])) {
            const phone = sub.tenants?.whatsapp_number || sub.tenants?.phone;
            if (phone) {
                const daysLeft = Math.ceil((new Date(sub.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                const msg = `⚠️ *Abonelik Hatırlatma*\n\nSayın ${sub.tenants?.name},\n\nAboneliğinizin süresinin dolmasına *${daysLeft} gün* kaldı (${sub.expires_at}).\n\nHizmet kesintisi yaşamamak için lütfen ödemenizi yapınız.\n\n— Randevu Sistemi Yönetimi`;
                await sendWhatsApp(phone, msg);
                sentCount++;
            }
        }

        // Bekleyen ödemeleri de hatırlat
        const { data: pendingPayments } = await supabase
            .from('payments')
            .select('*, tenants(name, phone, whatsapp_number)')
            .eq('status', 'pending');

        for (const p of (pendingPayments || [])) {
            const phone = p.tenants?.whatsapp_number || p.tenants?.phone;
            if (phone) {
                const msg = `💳 *Ödeme Hatırlatma*\n\nSayın ${p.tenants?.name},\n\n₺${p.amount} tutarındaki ödemeniz beklemektedir.\n\nLütfen en kısa sürede ödemenizi yapınız.\n\n— Randevu Sistemi Yönetimi`;
                await sendWhatsApp(phone, msg);
                sentCount++;
            }
        }

        const { logActivity } = require('../../lib/activityLog');
        await logActivity({
            actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
            action: 'payment.reminders_sent', details: { sent_count: sentCount }, ipAddress: req.ip
        });

        return res.json({ success: true, sent_count: sentCount });
    } catch (err) {
        console.error('[Payment Reminders]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
