-- ============================================================
-- APPOINTMENT BOOKING — Ek Hizmetler (Upsell) Tabloları
-- ============================================================

-- 1. SERVICE EXTRAS (Ek Hizmetler)
-- Her bir ekstra hizmet belirli bir ana hizmete (service_id) bağlıdır.
create table if not exists service_extras (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  service_id uuid references services(id) on delete cascade not null,
  name text not null,
  price numeric(10,2) not null default 0,
  duration_minutes int not null default 0, -- Opsiyonel ekstra süre
  created_at timestamptz default now()
);

-- 2. APPOINTMENT EXTRAS (Randevu - Ek Hizmet İlişkisi)
-- Müşterinin seçtiği ek hizmetleri randevu ile eşleştirir.
create table if not exists appointment_extras (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade not null,
  extra_id uuid references service_extras(id) on delete cascade not null,
  price_at_booking numeric(10,2) not null, -- Rezervasyon anındaki fiyatı (fiyat değişirse geçmiş randevular etkilenmesin diye)
  created_at timestamptz default now(),
  -- Bir randevuya aynı ek hizmet birden fazla kez eklenemesin
  unique (appointment_id, extra_id)
);

-- 3. İNDEKSLER (Performans için)
create index if not exists idx_service_extras_tenant on service_extras(tenant_id);
create index if not exists idx_service_extras_service on service_extras(service_id);
create index if not exists idx_appointment_extras_appointment on appointment_extras(appointment_id);

-- 4. ROW LEVEL SECURITY (Güvenlik)
alter table service_extras enable row level security;
alter table appointment_extras enable row level security;

-- Not: Service rolü (backend) tüm tablolara tam erişime sahiptir (RLS bypass yapar).
