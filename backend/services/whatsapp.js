const twilio = require('twilio');

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    } catch (e) {
        console.error('[Twilio] Initialization error:', e.message);
    }
} else {
    console.warn('[Twilio] Credentials missing. WhatsApp/SMS features are disabled.');
}

/**
 * WhatsApp mesajı gönder (Twilio Sandbox veya Business API)
 * @param {string} to   - Alıcı numarası, ör: "+905551234567"
 * @param {string} body - Mesaj içeriği
 */
async function sendWhatsApp(to, body) {
    if (!client) {
        console.log(`[WhatsApp-MOCK] Gönderildi (Twilio kapalı) → ${to}`);
        return { success: true, mock: true };
    }
    try {
        const msg = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${to}`,
            body,
        });
        console.log(`[WhatsApp] Gönderildi → ${to} | SID: ${msg.sid}`);
        return { success: true, sid: msg.sid };
    } catch (err) {
        console.error(`[WhatsApp] Hata → ${to}:`, err.message);
        // Fallback: SMS dene
        return sendSMS(to, body);
    }
}

/**
 * SMS gönder (WhatsApp başarısız olursa fallback)
 */
async function sendSMS(to, body) {
    try {
        const msg = await client.messages.create({
            from: process.env.TWILIO_SMS_FROM,
            to,
            body,
        });
        console.log(`[SMS] Gönderildi → ${to} | SID: ${msg.sid}`);
        return { success: true, sid: msg.sid, channel: 'sms' };
    } catch (err) {
        console.error(`[SMS] Hata → ${to}:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Randevu onay mesajı oluştur
 */
function buildConfirmationMessage({ customerName, serviceName, date, time, businessName, businessPhone }) {
    return (
        `Merhaba ${customerName}! 👋\n\n` +
        `${businessName} için randevunuz oluşturuldu.\n\n` +
        `📅 Tarih: ${date}\n` +
        `🕐 Saat: ${time}\n` +
        `✂️ Hizmet: ${serviceName}\n\n` +
        `Sorularınız için: ${businessPhone}\n` +
        `İptal etmek isterseniz lütfen en az 2 saat öncesinde bildiriniz.`
    );
}

/**
 * Süresi dolmuş randevu mesajı
 * (Randevu saati geçtikten sonra iptal edildiğinde gönderilir)
 */
function buildExpiredMessage({ customerName, serviceName, date, time, businessName, businessPhone }) {
    return (
        `Merhaba ${customerName},\n\n` +
        `${businessName} işletmesindeki aşağıdaki randevunuzun süresi dolmuştur:\n\n` +
        `📅 Tarih: ${date}\n` +
        `🕐 Saat: ${time}\n` +
        `✂️ Hizmet: ${serviceName}\n\n` +
        `Yeni bir randevu oluşturmak isterseniz bizimle iletişime geçebilirsiniz.\n` +
        `📞 ${businessPhone}`
    );
}

/**
 * Randevu iptal mesajı
 * (Geçerli/gelecek bir randevu iptal edildiğinde gönderilir)
 */
function buildCancellationMessage({ customerName, serviceName, date, time, businessName, businessPhone }) {
    return (
        `Merhaba ${customerName},\n\n` +
        `Üzgünüz, ${businessName} işletmesindeki randevunuz iptal edilmiştir.\n\n` +
        `📅 Tarih: ${date}\n` +
        `🕐 Saat: ${time}\n` +
        `✂️ Hizmet: ${serviceName}\n\n` +
        `Yeni randevu almak veya bilgi almak için lütfen bizimle iletişime geçin:\n` +
        `📞 ${businessPhone}\n\n` +
        `İyi günler dileriz! 🙏`
    );
}

module.exports = { sendWhatsApp, sendSMS, buildConfirmationMessage, buildExpiredMessage, buildCancellationMessage };
