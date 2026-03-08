-- ============================================================
-- APPOINTMENT BOOKING — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. TENANTS (işletmeler)
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,         -- URL dostu kimlik, örn: "salon-ayse"
  phone text,
  email text,
  address text,
  whatsapp_number text,             -- İşletmenin WhatsApp numarası
  created_at timestamptz default now()
);

-- 2. SERVICES (hizmetler)
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  duration_minutes int not null default 60,
  price numeric(10,2),
  created_at timestamptz default now()
);

-- 3. APPOINTMENTS (randevular)
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  notification_sent boolean default false,
  created_at timestamptz default now(),
  -- Aynı tarih+saate çift randevu engeli
  unique (tenant_id, appointment_date, appointment_time)
);

-- 4. ROW LEVEL SECURITY — Her tenant kendi verisini görür
alter table tenants enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;

-- Service role (backend) her şeyi görebilir — RLS bypass
-- Frontend için public anon key YOKTUR; sadece backend service key kullanılır.

-- 5. İNDEKSLER
create index if not exists idx_appointments_tenant on appointments(tenant_id);
create index if not exists idx_appointments_date on appointments(appointment_date);
create index if not exists idx_services_tenant on services(tenant_id);

-- 6. ÖRNEK VERİ (test için)
insert into tenants (name, slug, phone, email, address, whatsapp_number) values
  ('Salon Ayşe', 'salon-ayse', '+905551234567', 'ayse@saloorn.com', 'İstanbul, Kadıköy', '+905551234567')
on conflict (slug) do nothing;

insert into services (tenant_id, name, duration_minutes, price)
  select id, 'Saç Boyama', 90, 400 from tenants where slug = 'salon-ayse'
on conflict do nothing;

insert into services (tenant_id, name, duration_minutes, price)
  select id, 'Manikür', 45, 150 from tenants where slug = 'salon-ayse'
on conflict do nothing;

insert into services (tenant_id, name, duration_minutes, price)
  select id, 'Saç Kesimi', 30, 100 from tenants where slug = 'salon-ayse'
on conflict do nothing;
