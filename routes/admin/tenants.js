const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// GET /api/admin/tenants — Liste
router.get('/', async (req, res) => {
    try {
        const { search, status, plan, page = 1, limit = 20, created_from, created_to } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('tenants')
            .select('id, name, slug, phone, email, address, whatsapp_number, is_active, current_plan_id, subscription_expires_at, notes, created_at', { count: 'exact' });

        if (search) {
            query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        if (status === 'active') query = query.eq('is_active', true);
        if (status === 'inactive') query = query.eq('is_active', false);
        if (plan) query = query.eq('current_plan_id', plan);
        if (created_from) query = query.gte('created_at', created_from);
        if (created_to) query = query.lte('created_at', created_to + 'T23:59:59');

        query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

        const { data: tenants, error, count } = await query;
        if (error) throw error;

        // Plan bilgilerini ekle
        const planIds = [...new Set(tenants.filter(t => t.current_plan_id).map(t => t.current_plan_id))];
        let plansMap = {};
        if (planIds.length > 0) {
            const { data: plans } = await supabase.from('subscription_plans').select('id, name, slug, price_monthly').in('id', planIds);
            if (plans) plans.forEach(p => plansMap[p.id] = p);
        }

        // Her tenant icin istatistikler
        const enriched = await Promise.all(tenants.map(async (t) => {
            const [apptRes, svcRes, staffRes] = await Promise.all([
                supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id).is('deleted_at', null),
                supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
                supabase.from('staff').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id)
            ]);
            return {
                ...t,
                plan: plansMap[t.current_plan_id] || null,
                stats: {
                    appointments: apptRes.count || 0,
                    services: svcRes.count || 0,
                    staff: staffRes.count || 0
                }
            };
        }));

        return res.json({
            tenants: enriched,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil((count || 0) / parseInt(limit))
        });
    } catch (err) {
        console.error('[Admin Tenants List]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/tenants/:id — Detay
router.get('/:id', async (req, res) => {
    try {
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, name, slug, phone, email, address, whatsapp_number, is_active, current_plan_id, subscription_expires_at, notes, recovery_pin, created_at')
            .eq('id', req.params.id)
            .single();

        if (error || !tenant) return res.status(404).json({ error: 'İşletme bulunamadı.' });

        // Plan bilgisi
        let plan = null;
        if (tenant.current_plan_id) {
            const { data } = await supabase.from('subscription_plans').select('*').eq('id', tenant.current_plan_id).single();
            plan = data;
        }

        // Abonelik gecmisi
        const { data: subscriptions } = await supabase
            .from('tenant_subscriptions')
            .select('*, subscription_plans(name, slug)')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // Odeme gecmisi
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // Istatistikler
        const [apptRes, svcRes, staffRes, custRes] = await Promise.all([
            supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).is('deleted_at', null),
            supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
            supabase.from('staff').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
            supabase.from('appointments').select('customer_phone').eq('tenant_id', tenant.id).is('deleted_at', null)
        ]);

        const uniqueCustomers = custRes.data ? new Set(custRes.data.map(c => c.customer_phone)).size : 0;

        // Son aktiviteler
        const { data: logs } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('target_id', tenant.id)
            .order('created_at', { ascending: false })
            .limit(10);

        return res.json({
            tenant,
            plan,
            subscriptions: subscriptions || [],
            payments: payments || [],
            logs: logs || [],
            stats: {
                appointments: apptRes.count || 0,
                services: svcRes.count || 0,
                staff: staffRes.count || 0,
                customers: uniqueCustomers
            }
        });
    } catch (err) {
        console.error('[Admin Tenant Detail]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/tenants — Yeni isletme olustur
router.post('/', async (req, res) => {
    try {
        const { name, slug, phone, email, address, whatsapp_number, password, plan_id, subscription_months = 1, notes } = req.body;

        if (!name || !slug || !password) {
            return res.status(400).json({ error: 'İsim, slug ve şifre zorunludur.' });
        }

        // Slug benzersizlik kontrolu
        const { data: existing } = await supabase.from('tenants').select('id').eq('slug', slug.trim().toLowerCase()).single();
        if (existing) return res.status(409).json({ error: 'Bu işletme kodu zaten kullanılıyor.' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const recoveryPin = Math.random().toString(36).substring(2, 10).toUpperCase();

        const tenantData = {
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            phone: phone || null,
            email: email || null,
            address: address || null,
            whatsapp_number: whatsapp_number || null,
            password: hashedPassword,
            recovery_pin: recoveryPin,
            is_active: true,
            current_plan_id: plan_id || null,
            notes: notes || null
        };

        const { data: tenant, error } = await supabase.from('tenants').insert([tenantData]).select().single();
        if (error) throw error;

        // Abonelik olustur
        let subscription = null;
        if (plan_id) {
            const startsAt = new Date();
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + parseInt(subscription_months));

            const { data: sub } = await supabase.from('tenant_subscriptions').insert([{
                tenant_id: tenant.id,
                plan_id,
                status: 'active',
                starts_at: startsAt.toISOString().split('T')[0],
                expires_at: expiresAt.toISOString().split('T')[0],
                created_by: req.adminId
            }]).select().single();
            subscription = sub;

            // Tenant'a expiry yaz
            await supabase.from('tenants').update({
                subscription_expires_at: expiresAt.toISOString().split('T')[0]
            }).eq('id', tenant.id);
        }

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'tenant.created',
            targetType: 'tenant',
            targetId: tenant.id,
            details: { name: tenant.name, slug: tenant.slug, plan_id },
            ipAddress: req.ip
        });

        const { password: _pw, ...safeTenant } = tenant;
        return res.status(201).json({ tenant: safeTenant, subscription, recovery_pin: recoveryPin });
    } catch (err) {
        console.error('[Admin Create Tenant]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// PATCH /api/admin/tenants/:id — Guncelle
router.patch('/:id', async (req, res) => {
    try {
        const allowed = ['name', 'slug', 'phone', 'email', 'address', 'whatsapp_number', 'is_active', 'notes'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Güncellenecek alan yok.' });
        }

        const { data, error } = await supabase.from('tenants').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'tenant.updated',
            targetType: 'tenant',
            targetId: req.params.id,
            details: updates,
            ipAddress: req.ip
        });

        const { password: _pw, ...safe } = data;
        return res.json({ tenant: safe });
    } catch (err) {
        console.error('[Admin Update Tenant]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/tenants/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: 'Şifre en az 4 karakter olmalıdır.' });
        }

        const hashed = await bcrypt.hash(newPassword, 12);
        const { error } = await supabase.from('tenants').update({ password: hashed }).eq('id', req.params.id);
        if (error) throw error;

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'tenant.password_reset',
            targetType: 'tenant',
            targetId: req.params.id,
            ipAddress: req.ip
        });

        return res.json({ success: true, message: 'Şifre başarıyla güncellendi.' });
    } catch (err) {
        console.error('[Admin Reset Password]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/tenants/:id/toggle-status
router.post('/:id/toggle-status', async (req, res) => {
    try {
        const { data: tenant } = await supabase.from('tenants').select('is_active, name').eq('id', req.params.id).single();
        if (!tenant) return res.status(404).json({ error: 'İşletme bulunamadı.' });

        const newStatus = !tenant.is_active;
        await supabase.from('tenants').update({ is_active: newStatus }).eq('id', req.params.id);

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: newStatus ? 'tenant.enabled' : 'tenant.disabled',
            targetType: 'tenant',
            targetId: req.params.id,
            details: { name: tenant.name },
            ipAddress: req.ip
        });

        return res.json({ success: true, is_active: newStatus });
    } catch (err) {
        console.error('[Admin Toggle Status]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/tenants/:id/change-plan
router.post('/:id/change-plan', async (req, res) => {
    try {
        const { plan_id, subscription_months = 1 } = req.body;
        if (!plan_id) return res.status(400).json({ error: 'Plan ID gerekli.' });

        // Eski aboneligi kapat
        await supabase
            .from('tenant_subscriptions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('tenant_id', req.params.id)
            .eq('status', 'active');

        // Yeni abonelik olustur
        const startsAt = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + parseInt(subscription_months));

        const { data: sub } = await supabase.from('tenant_subscriptions').insert([{
            tenant_id: req.params.id,
            plan_id,
            status: 'active',
            starts_at: startsAt.toISOString().split('T')[0],
            expires_at: expiresAt.toISOString().split('T')[0],
            created_by: req.adminId
        }]).select().single();

        // Tenant guncelle
        await supabase.from('tenants').update({
            current_plan_id: plan_id,
            subscription_expires_at: expiresAt.toISOString().split('T')[0]
        }).eq('id', req.params.id);

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'subscription.plan_changed',
            targetType: 'tenant',
            targetId: req.params.id,
            details: { plan_id, subscription_months },
            ipAddress: req.ip
        });

        return res.json({ success: true, subscription: sub });
    } catch (err) {
        console.error('[Admin Change Plan]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/tenants/:id/extend-subscription
router.post('/:id/extend-subscription', async (req, res) => {
    try {
        const { days } = req.body;
        if (!days || days < 1) return res.status(400).json({ error: 'Uzatılacak gün sayısı gerekli.' });

        // Aktif aboneligi bul
        const { data: sub } = await supabase
            .from('tenant_subscriptions')
            .select('*')
            .eq('tenant_id', req.params.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!sub) return res.status(404).json({ error: 'Aktif abonelik bulunamadı.' });

        const newExpiry = new Date(sub.expires_at);
        newExpiry.setDate(newExpiry.getDate() + parseInt(days));
        const newExpiryStr = newExpiry.toISOString().split('T')[0];

        await supabase.from('tenant_subscriptions').update({
            expires_at: newExpiryStr,
            updated_at: new Date().toISOString()
        }).eq('id', sub.id);

        await supabase.from('tenants').update({
            subscription_expires_at: newExpiryStr
        }).eq('id', req.params.id);

        await logActivity({
            actorType: 'super_admin',
            actorId: req.adminId,
            actorName: req.adminUsername,
            action: 'subscription.extended',
            targetType: 'tenant',
            targetId: req.params.id,
            details: { days, new_expires_at: newExpiryStr },
            ipAddress: req.ip
        });

        return res.json({ success: true, new_expires_at: newExpiryStr });
    } catch (err) {
        console.error('[Admin Extend Sub]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
