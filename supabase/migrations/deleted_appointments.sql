-- 1. Add deleted_at column
alter table appointments add column if not exists deleted_at timestamptz;

-- 2. Handle unique constraint to allow re-booking deleted slots
-- First, find the constraint name. It's usually appointments_tenant_id_appointment_date_appointment_time_key
alter table appointments drop constraint if exists appointments_tenant_id_appointment_date_appointment_time_key;

-- 3. Create a conditional unique index that only applies to active (non-deleted) appointments
create unique index if not exists idx_appointments_active_slot 
on appointments (tenant_id, appointment_date, appointment_time) 
where (deleted_at is null);
