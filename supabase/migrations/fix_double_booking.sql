-- 1. Eski, yetersiz veya hatalı indexleri temizle
DROP INDEX IF EXISTS idx_appointments_active_slot;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_tenant_id_appointment_date_appointment_time_key;

-- 2. Personel bazlı (veya personel yoksa işletme bazlı) çakışma engelleyici UNIQUE index
-- Not: COALESCE ile NULL staff_id durumunu da tekilleştiriyoruz.
-- Bu index sayesinde aynı anda iki istek gelse bile veritabanı seviyesinde birisi reddedilir.
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_staff_slot 
ON appointments (tenant_id, COALESCE(staff_id, '00000000-0000-0000-0000-000000000000'), appointment_date, appointment_time) 
WHERE (deleted_at IS NULL AND status != 'cancelled');
