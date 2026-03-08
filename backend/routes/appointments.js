const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendWhatsApp, buildConfirmationMessage, buildExpiredMessage, buildCancellationMessage } = require('../services/whatsapp');
const { broadcast } = require('../lib/sse');
const { authenticateTenant } = require('../middleware/auth');
const { appointmentSchema } = require('../lib/validation');

// ─── Yardımcı: Tarih+Saat geçmişte mi? ───────────────────────────────────────
function isPastSlot(dateStr, timeStr) {
    const now = new Date();
    const slotDateTime = new Date(`${dateStr}T${timeStr.slice(0, 5)}:00`);
    return slotDateTime <= now;
}

// ─── Tally.so form alanlarını parse et ───────────────────────────────────────
function parseTallyFields(fields = []) {
    const result = {};
    fields.forEach((f) => {
        const label = (f.label || '').toLowerCase();
        const value = Array.isArray(f.value) ? f.value[0] : f.value;
        if (label.includes('ad') || label.includes('isim')) result.customer_name = value;
        if (label.includes('telefon') || label.includes('phone')) result.customer_phone = value;
        if (label.includes('tarih') || label.includes('date')) result.appointment_date = value;
        if (label.includes('saat') || label.includes('time')) result.appointment_time = value;
        if (label.includes('hizmet') || label.includes('servis') || label.includes('service')) result.service_name = value;
        if (label.includes('not') || label.includes('açıklama')) result.notes = value;
    });
    return result;
}

// ─── POST /api/appointments  (Manuel veya Tally Webhook) ─────────────────────
// Müşteriye açık (Public), ancak Joi ile doğrulanıyor.
router.post('/', async (req, res) => {
    try {
        let payload = {};
        if (req.body?.data?.fields) {
            payload = parseTallyFields(req.body.data.fields);
        } else {
            payload = req.body;
        }

        const { error: valError } = appointmentSchema.validate(payload);
        if (valError) return res.status(400).json({ error: valError.details[0].message });

        const { customer_name, customer_phone, appointment_date, appointment_time, service_name, notes, staff_id } = payload;
        const tenantSlug = req.query.tenant;
        let tenantId = payload.tenant_id;

        if (isPastSlot(appointment_date, appointment_time)) {
            return res.status(400).json({ error: 'Geçmiş bir tarih veya saate randevu alınamaz.' });
        }

        let tenant = null;
        if (!tenantId && tenantSlug) {
            const { data: t } = await supabase.from('tenants').select('id, name, phone').eq('slug', tenantSlug).single();
            if (!t) return res.status(404).json({ error: `İşletme bulunamadı: ${tenantSlug}` });
            tenant = t;
            tenantId = t.id;
        }

        if (!tenantId) return res.status(400).json({ error: 'tenant_id veya ?tenant= slug parametresi gerekli.' });

        const normalizedPhone = customer_phone.startsWith('+') ? customer_phone : `+90${customer_phone.replace(/\D/g, '').slice(-10)}`;
        const normalizedTime = appointment_time.length === 5 ? appointment_time + ':00' : appointment_time;

        // Müsaitlik kontrolü...
        const { data: staffList } = await supabase.from('staff').select('id, name').eq('tenant_id', tenantId);
        const hasStaff = staffList && staffList.length > 0;
        let finalStaffId = staff_id || null;

        const { data: generalBlock } = await supabase.from('blocked_slots')
            .select('id').eq('tenant_id', tenantId).eq('blocked_date', appointment_date)
            .eq('blocked_time', normalizedTime).is('staff_id', null).maybeSingle();

        if (generalBlock) return res.status(409).json({ error: 'Bu saat işletme tarafından kapatılmış.' });

        if (hasStaff) {
            const { data: existingAppts } = await supabase.from('appointments').select('staff_id')
                .eq('tenant_id', tenantId).eq('appointment_date', appointment_date)
                .eq('appointment_time', normalizedTime).neq('status', 'cancelled');

            const { data: staffBlocks } = await supabase.from('blocked_slots').select('staff_id')
                .eq('tenant_id', tenantId).eq('blocked_date', appointment_date)
                .eq('blocked_time', normalizedTime).not('staff_id', 'is', null);

            const bookedStaffIds = new Set((existingAppts || []).map(a => a.staff_id));
            const blockedStaffIds = new Set((staffBlocks || []).map(b => b.staff_id));

            if (finalStaffId) {
                if (bookedStaffIds.has(finalStaffId) || blockedStaffIds.has(finalStaffId)) {
                    return res.status(409).json({ error: 'Seçilen personel bu saatte doludur.' });
                }
            } else {
                const availableStaff = staffList.find(s => !bookedStaffIds.has(s.id) && !blockedStaffIds.has(s.id));
                if (availableStaff) finalStaffId = availableStaff.id;
                else return res.status(409).json({ error: 'Bu saatte tüm personellerimiz doludur.' });
            }
        } else {
            const { data: existing } = await supabase.from('appointments').select('id').eq('tenant_id', tenantId)
                .eq('appointment_date', appointment_date).eq('appointment_time', normalizedTime)
                .neq('status', 'cancelled').maybeSingle();
            if (existing) return res.status(409).json({ error: 'Bu tarih ve saatte zaten bir randevu alınmış.' });
        }

        let serviceId = payload.service_id || null;
        let serviceName = service_name || 'Belirtilmedi';

        if (!serviceId && service_name) {
            const { data: svc } = await supabase.from('services').select('id, name').eq('tenant_id', tenantId).ilike('name', `%${service_name}%`).limit(1).single();
            if (svc) {
                serviceId = svc.id;
                serviceName = svc.name;
            }
        } else if (serviceId) {
            const { data: svc } = await supabase.from('services').select('id, name').eq('id', serviceId).single();
            if (svc) {
                serviceName = svc.name;
            }
        }

        const { data: appointment, error } = await supabase.from('appointments').insert([{
            tenant_id: tenantId, service_id: serviceId, staff_id: finalStaffId,
            customer_name, customer_phone: normalizedPhone, appointment_date,
            appointment_time: normalizedTime, notes: notes || null, status: 'pending',
        }]).select('*, services(name, price, discounted_price, duration_minutes), staff(name), appointment_extras(price_at_booking, service_extras(name, price, duration_minutes))').single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Bu tarih ve saatte zaten bir randevu bulunuyor.' });
            }
            throw error;
        }

        if (!tenant) {
            const { data: t } = await supabase.from('tenants').select('id, name, phone').eq('id', tenantId).single();
            tenant = t;
        }

        // --- HİZMET EKSTRALARINI (UPSELL) KAYDET ---
        let extraServicesSummary = '';
        if (payload.extra_ids && payload.extra_ids.length > 0 && serviceId) {
            try {
                const { data: extrasList } = await supabase
                    .from('service_extras')
                    .select('*')
                    .in('id', payload.extra_ids)
                    .eq('service_id', serviceId);

                if (extrasList && extrasList.length > 0) {
                    const extraInserts = extrasList.map(ex => ({
                        appointment_id: appointment.id,
                        extra_id: ex.id,
                        price_at_booking: ex.price
                    }));

                    await supabase.from('appointment_extras').insert(extraInserts);
                    const extraNames = extrasList.map(ex => ex.name).join(', ');
                    extraServicesSummary = ` (+ ${extraNames})`;

                    // Ekstralar eklendikten sonra 'appointment' nesnesini tekrar güncellemeye gerek yok 
                    // çünkü SSE mesajında 'extraServicesSummary' zaten kullanılıyor ve card render'ı tabloyu fetch edecek.
                    // Ancak Modal için SSE verisinin tam olması isteniyorsa bir kez daha çekmek gerekebilir.
                }
            } catch (exErr) {
                console.error('[Extra Services Insert Error]', exErr);
            }
        }

        const message = buildConfirmationMessage({
            customerName: customer_name, serviceName: serviceName + extraServicesSummary, date: appointment_date, time: appointment_time,
            businessName: tenant?.name || 'İşletme', businessPhone: tenant?.phone || '',
        });

        sendWhatsApp(normalizedPhone, message).then(() => {
            supabase.from('appointments').update({ notification_sent: true }).eq('id', appointment.id);
        }).catch(err => console.error('[Bildirim] Hata:', err.message));

        // Ekstralar dahil TAM veriyi çek (extras insert edildikten sonra)
        // insert anında çekilen veri appointment_extras içermez!
        const { data: fullAppt } = await supabase
            .from('appointments')
            .select('*, services(name, price, discounted_price, duration_minutes), staff(name), appointment_extras(price_at_booking, service_extras(name, price, duration_minutes))')
            .eq('id', appointment.id)
            .single();

        broadcast(tenantId, 'new-appointment', fullAppt || appointment);

        return res.status(201).json({ success: true, appointment: fullAppt || appointment });
    } catch (err) {
        console.error('[POST /appointments]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ─── GET /api/appointments/:tenantId  (Dashboard) ───────────────────────────
router.get('/:tenantId', authenticateTenant, async (req, res) => {
    try {
        const { tenantId } = req.params;
        if (tenantId !== req.tenantId) return res.status(403).json({ error: 'Bu verilere erişim izniniz yok.' });

        const { date, status, staff_id, show_deleted } = req.query;

        let query = supabase
            .from('appointments')
            .select('*, services(name, price, discounted_price, duration_minutes), staff(name), appointment_extras(price_at_booking, service_extras(name, price, duration_minutes))')
            .eq('tenant_id', tenantId)
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });

        if (show_deleted === 'true') {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            query = query.not('deleted_at', 'is', null).gte('deleted_at', twentyFourHoursAgo);
        } else {
            query = query.is('deleted_at', null);
        }

        if (date) query = query.eq('appointment_date', date);
        if (status) query = query.eq('status', status);
        if (staff_id) query = query.eq('staff_id', staff_id);

        const { data, error } = await query;
        if (error) throw error;

        return res.json({ appointments: data });
    } catch (err) {
        console.error('[GET /appointments]', err);
        return res.status(500).json({ error: 'Veriler alınamadı.' });
    }
});

// ─── PATCH /api/appointments/:id/status ─────────────────────────────────────
router.patch('/:id/status', authenticateTenant, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Geçersiz durum.' });
        }

        // Mevcut randevu bilgilerini çek (WhatsApp için gerekli)
        const { data: existing, error: fetchErr } = await supabase
            .from('appointments')
            .select('*, services(name), tenants(name, phone)')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) return res.status(404).json({ error: 'Randevu bulunamadı.' });
        if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Bu işlemi yapma yetkiniz yok.' });

        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // İptal durumunda müşteriye WhatsApp bildirimi gönder
        if (status === 'cancelled' && existing?.customer_phone) {
            const apptDateTime = new Date(`${existing.appointment_date}T${existing.appointment_time.slice(0, 5)}:00`);
            const isExpired = apptDateTime <= new Date();

            const msgParams = {
                customerName: existing.customer_name,
                serviceName: existing.services?.name || 'Randevu',
                date: existing.appointment_date,
                time: existing.appointment_time.slice(0, 5),
                businessName: existing.tenants?.name || 'İşletme',
                businessPhone: existing.tenants?.phone || '',
            };

            const message = isExpired
                ? buildExpiredMessage(msgParams)
                : buildCancellationMessage(msgParams);

            sendWhatsApp(existing.customer_phone, message)
                .catch((err) => console.error('[İptal Bildirimi] Hata:', err.message));
        }

        return res.json({ success: true, appointment: data });
    } catch (err) {
        console.error('[PATCH /appointments/status]', err);
        return res.status(500).json({ error: err.message });
    }
});

// ─── PATCH /api/appointments/:id/restore ────────────────────────────────────
router.patch('/:id/restore', authenticateTenant, async (req, res) => {
    try {
        const { id } = req.params;

        // deleted_at filtresi olmadan direkt tenant kontrolü yaparak güncelle
        const { data, error } = await supabase
            .from('appointments')
            .update({ deleted_at: null, status: 'pending' })
            .eq('id', id)
            .eq('tenant_id', req.tenantId)  // tenant güvenlik kontrolü update'e gömüldü
            .select('customer_name')
            .single();

        if (error) {
            console.error('[RESTORE] Supabase error:', error);
            // Unique constraint ihlali (aynı slot zaten dolu)
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Bu tarih ve saatte zaten aktif bir randevu var. Önce onu iptal edin.' });
            }
            throw error;
        }

        if (!data) {
            return res.status(404).json({ error: 'Randevu bulunamadı veya bu işlem için yetkiniz yok.' });
        }

        return res.json({ success: true, message: `"${data.customer_name}" randevusu geri getirildi.` });
    } catch (err) {
        console.error('[PATCH /appointments/restore]', err);
        return res.status(500).json({ error: err.message });
    }
});


// ─── DELETE /api/appointments/:id ───────────────────────────────────────────
router.delete('/:id', authenticateTenant, async (req, res) => {
    try {
        const { id } = req.params;

        // Sahiplik kontrolü: bu randevu bu tenant'a mı ait?
        const { data: existing, error: fetchErr } = await supabase
            .from('appointments')
            .select('tenant_id')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) return res.status(404).json({ error: 'Randevu bulunamadı.' });
        if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Bu randevuyu silme yetkiniz yok.' });

        // Soft delete: status = cancelled ve deleted_at = now()
        const { error } = await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                deleted_at: new Date().toISOString()
            })
            .eq('id', id);
        if (error) throw error;
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
