const supabase = require('../lib/supabase');
const { sendWhatsApp, buildWaitlistAvailableMessage } = require('./whatsapp');

/**
 * Bekleme listesindeki uygun müşterilere bildirim gönder
 * @param {string} tenantId 
 * @param {string} date 
 * @param {string} time 
 */
async function notifyWaitlist(tenantId, date, time) {
    try {
        console.log(`[Waitlist] Kontrol ediliyor: ${tenantId} | ${date} | ${time}`);

        // 1. Bu slot için 'waiting' durumundaki kayıtları çek
        const { data: waitingEntries, error } = await supabase
            .from('waitlist')
            .select('*, services(name), tenants(name, phone)')
            .eq('tenant_id', tenantId)
            .eq('requested_date', date)
            .eq('requested_time', time)
            .eq('status', 'waiting');

        if (error) throw error;
        if (!waitingEntries || waitingEntries.length === 0) {
            console.log('[Waitlist] Uygun kayıt bulunamadı.');
            return;
        }

        console.log(`[Waitlist] ${waitingEntries.length} kişi bilgilendiriliyor...`);

        // 2. Her birine bildirim gönder ve durumunu 'contacted' yap
        for (const entry of waitingEntries) {
            const message = buildWaitlistAvailableMessage({
                customerName: entry.customer_name,
                serviceName: entry.services?.name || 'Randevu',
                date: entry.requested_date,
                time: entry.requested_time.slice(0, 5),
                businessName: entry.tenants?.name || 'İşletme',
                businessPhone: entry.tenants?.phone || '',
            });

            await sendWhatsApp(entry.customer_phone, message);

            // Durumu güncelle
            await supabase
                .from('waitlist')
                .update({ status: 'contacted' })
                .eq('id', entry.id);
        }

    } catch (err) {
        console.error('[Waitlist Service Error]', err.message);
    }
}

module.exports = { notifyWaitlist };
