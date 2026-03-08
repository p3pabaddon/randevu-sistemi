# Randevu Yönetim Sistemi

Güzellik salonu, kuaför, klinik gibi işletmelere satılabilecek çok kiracılı (multi-tenant) randevu yönetim sistemi.

---

## Kurulum

### 1. Bağımlılıkları Yükle
```bash
cd appointment-booking
npm install
```

### 2. Ortam Değişkenlerini Ayarla
```bash
cp .env.example .env
# .env dosyasını düzenle
```

### 3. Supabase Şemasını Oluştur
Supabase SQL Editor'a gir ve `supabase/schema.sql` dosyasının içeriğini çalıştır.

### 4. Sunucuyu Başlat
```bash
npm run dev   # geliştirme (nodemon)
# veya
npm start     # production
```

Uygulama: `http://localhost:3000`

---

## Yapı

```
appointment-booking/
├── server.js              # Express giriş noktası
├── lib/
│   └── supabase.js        # Supabase client
├── routes/
│   ├── appointments.js    # CRUD + Tally webhook
│   └── tenants.js         # İşletme yönetimi
├── services/
│   └── whatsapp.js        # Twilio WhatsApp/SMS
├── public/
│   ├── index.html         # SPA dashboard
│   ├── style.css          # Premium Montserrat tasarım
│   └── app.js             # Dashboard JS
└── supabase/
    └── schema.sql         # Veritabanı şeması
```

---

## Özellikler

| Özellik | Durum |
|---------|-------|
| Tally.so webhook alımı | ✅ |
| Geçmiş tarih/saat engeli | ✅ |
| Çift randevu engeli | ✅ |
| WhatsApp bildirimi (Twilio) | ✅ |
| SMS fallback | ✅ |
| Supabase Realtime | ✅ |
| Multi-tenant dashboard | ✅ |
| WhatsApp hızlı gönder butonu | ✅ |
| Randevu durum yönetimi | ✅ |

---

## Yeni İşletme Eklemek

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Salon Ayşe","slug":"salon-ayse","phone":"+905551234567","whatsapp_number":"+905551234567"}'
```

Dashboard URL: `http://localhost:3000` → giriş: `salon-ayse`

---

## Tally.so Entegrasyonu

Tally formunuzun webhook adresine şunu ekleyin:
```
http://your-server.com/api/appointments?tenant=<slug>
```

> Yerel test için [ngrok](https://ngrok.com) kullanın: `npx ngrok http 3000`

---

## Twilio (WhatsApp Sandbox Testi)

1. [Twilio Console](https://console.twilio.com) → WhatsApp Sandbox'a katıl
2. `.env` içine `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` gir
3. `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` (sandbox numarası)

---

## Deploy (Render.com)

1. Render.com → New Web Service → GitHub repo bağla
2. Build: `npm install` / Start: `node server.js`
3. Environment Variables'a `.env` içeriğini ekle
4. Deploy et → URL'yi Supabase CORS + Tally webhook'a ekle
