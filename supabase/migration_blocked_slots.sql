-- blocked_slots tablosu ekle (schema.sql'e ek olarak SQL Editörde çalıştır)
create table if not exists blocked_slots (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete cascade,
  blocked_date date not null,
  blocked_time time not null,
  created_at  timestamptz default now(),
  unique (tenant_id, blocked_date, blocked_time)
);

alter table blocked_slots enable row level security;
create index if not exists idx_blocked_tenant_date on blocked_slots(tenant_id, blocked_date);
