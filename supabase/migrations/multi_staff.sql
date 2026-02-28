-- 1. Create staff table
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
alter table staff enable row level security;

-- 2. Add staff_id to appointments
alter table appointments add column if not exists staff_id uuid references staff(id) on delete set null;

-- 3. Update blocked_slots table
alter table blocked_slots drop constraint if exists blocked_slots_tenant_id_blocked_date_blocked_time_key;
alter table blocked_slots add column if not exists staff_id uuid references staff(id) on delete cascade;
-- Add new unique constraint combining tenant, staff, date, time
alter table blocked_slots add constraint blocked_slots_tenant_staff_date_time_key unique (tenant_id, staff_id, blocked_date, blocked_time);
