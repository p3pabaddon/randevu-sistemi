const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// WhatsApp servisini güvenli şekilde yükle
let sendWhatsApp;
try {
    sendWhatsApp = require('../../services/whatsapp').sendWhatsApp;
} catch (e) {
    console.warn('[Notifications] WhatsApp servisi yüklenemedi:', e.message);
    sendWhatsApp = async () => ({ success: false, mock: true });
}

// GET /api/admin/notifications
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { data, error, count } = await supabase
            .from('tenant_notifications')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) throw error;

        // sent_by bilgisini ayrı çek (join sorununu önlemek için)
        const notifications = data || [];
        const adminIds = [...new Set(notifications.filter(n => n.sent_by).map(n => n.sent_by))];
        let adminsMap = {};
        if (adminIds.length > 0) {
            const { data: admins } = await supabase
                .from('super_admins')
                .select('id, display_name')
                .in('id', adminIds);
            if (admins) {
                admins.forEach(a => adminsMap[a.id] = a.display_name);
            }
        }
        notifications.forEach(n => {
            n.admin_name = adminsMap[n.sent_by] || 'Sistem';
        });

        return res.json({ notifications, total: count, page: parseInt(page), totalPages: Math.ceil((count || 0) / parseInt(limit)) });
    } catch (err) {
        console.error('[Admin Notifications List]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/notifications
router.post('/', async (req, res) => {
    try {
        const { title, message, target_type, target_plan_id, target_tenant_ids, sent_via } = req.body;
        if (!title || !message) return res.status(400).json({ error: 'Başlık ve mesaj gerekli.' });

        // Bildirimi kaydet
        const insertData = {
            title, message,
            target_type: target_type || 'all',
            target_plan_id: target_plan_id || null,
            target_tenant_ids: target_tenant_ids || [],
            sent_via: sent_via || 'panel',
            sent_by: req.adminId
        };

        const { data: notif, error } = await supabase.from('tenant_notifications').insert([insertData]).select().single();

        if (error) {
            console.error('[Admin Notification Insert Error]', error);
            throw error;
        }

        // WhatsApp gönderimi (opsiyonel, hata olursa devam et)
        let whatsappSent = 0;
        if (sent_via === 'whatsapp' || sent_via === 'both') {
            try {
                let query = supabase.from('tenants').select('id, name, whatsapp_number, phone').eq('is_active', true);

                if (target_type === 'plan' && target_plan_id) {
                    query = query.eq('current_plan_id', target_plan_id);
                } else if (target_type === 'specific' && target_tenant_ids?.length) {
                    query = query.in('id', target_tenant_ids);
                }

                const { data: tenants } = await query;
                for (const t of (tenants || [])) {
                    const phone = t.whatsapp_number || t.phone;
                    if (phone) {
                        try {
                            const whatsappMsg = `📢 *${title}*\n\n${message}\n\n— Randevu Sistemi Yönetimi`;
                            await sendWhatsApp(phone, whatsappMsg);
                            whatsappSent++;
                        } catch (wpErr) {
                            console.error(`[WhatsApp] Gönderim hatası (${t.name}):`, wpErr.message);
                        }
                    }
                }
                console.log(`[Notification] WhatsApp sent to ${whatsappSent} tenants`);
            } catch (wpError) {
                console.error('[Notification WhatsApp Error]', wpError.message);
            }
        }

        try {
            await logActivity({
                actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
                action: 'notification.sent', details: { title, target_type, sent_via, whatsapp_sent: whatsappSent }, ipAddress: req.ip
            });
        } catch (logErr) {
            console.error('[Activity Log Error]', logErr.message);
        }

        return res.status(201).json({ notification: notif, whatsapp_sent: whatsappSent });
    } catch (err) {
        console.error('[Admin Send Notification]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
