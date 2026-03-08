# 🔑 Kurtarma Kodları — GİZLİ

> Bu dosyayı kimseyle paylaşma. Her işletmenin kurtarma kodu yalnızca o işletmenin şifresini sıfırlamak için kullanılır.
> Yeni işletme eklendiğinde Supabase trigger'ı otomatik kod atar — kodu buraya ekle.

## Aktif İşletmeler

| İşletme Kodu (Slug) | İşletme Adı | Kurtarma Kodu | Oluşturulma |
|---|---|---|---|
| elite-guzellik | Elite Güzellik | `E159E347` | 2026-03-03 |
| salon-ayse | Salon Ayşe | `DFCEA102` | 2026-03-03 |
| salon-fatma | Salon Fatma | `CEE3FF3F` | 2026-03-03 |

---

## Kurtarma Kodu Nasıl Alınır?

1. Supabase Dashboard → Table Editor → `tenants` tablosunu aç
2. İşletmenin satırına bak → `recovery_pin` sütunu
3. Kodu buraya ekle ve işletme sahibine ilet

Veya admin paneli → Denetim sekmesi → **🔑 KURTARMA KODU** bölümü (Göster butonu ile görülebilir)

---

## Supabase Trigger (Yeni İşletmeler İçin)

Aşağıdaki SQL ile yeni her işletme eklendiğinde otomatik kod atanır:

```sql
CREATE OR REPLACE FUNCTION generate_recovery_pin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recovery_pin IS NULL THEN
    NEW.recovery_pin := upper(substring(md5(random()::text || NEW.slug), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_recovery_pin
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION generate_recovery_pin();
```

---

## Güvenlik Notları

- Kurtarma kodu **yalnızca** o işletmenin slug'ı ile birlikte çalışır
- Başka işletmenin koduyla erişim **imkânsız** (backend + DB seviyesinde korumalı)
- İşletme sahibi şifresini değiştirirse kurtarma kodu **değişmez**
- Kurtarma kodu değiştirilmek istenirse Supabase'den manuel güncelleme yapılır
