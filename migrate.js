// Bekleme listesi tablosunu Supabase'de oluşturur.
// Çalıştırmak için: node migrate.js
require('dotenv').config();
const supabase = require('./lib/supabase');

async function migrate() {
    console.log('[Migrate] Bekleme listesi tablosu oluşturuluyor...');

    // Supabase'de CREATE TABLE için rpc kullanıyoruz
    const { error } = await supabase.rpc('exec_sql', {
        sql: `
            create table if not exists waitlist (
                id uuid primary key default gen_random_uuid(),
                tenant_id uuid references tenants(id) on delete cascade not null,
                customer_name text not null,
                customer_phone text not null,
                requested_date date not null,
                requested_time text not null,
                service_id uuid references services(id) on delete set null,
                notes text,
                status text default 'waiting' check (status in ('waiting','contacted','booked','cancelled')),
                created_at timestamptz default now()
            );
            create index if not exists waitlist_tenant_idx on waitlist(tenant_id);
        `
    });

    if (error) {
        // exec_sql RPC yoksa, REST API ile direk insert/select denemesi yapılır
        // (Supabase free tier'da exec_sql genellikle yoktur)
        console.warn('[Migrate] exec_sql RPC bulunamadı. Lütfen aşağıdaki SQL\'i Supabase Dashboard > SQL Editor\'da çalıştırın:');
        console.log(`
create table if not exists waitlist (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references tenants(id) on delete cascade not null,
    customer_name text not null,
    customer_phone text not null,
    requested_date date not null,
    requested_time text not null,
    service_id uuid references services(id) on delete set null,
    notes text,
    status text default 'waiting' check (status in ('waiting','contacted','booked','cancelled')),
    created_at timestamptz default now()
);
create index if not exists waitlist_tenant_idx on waitlist(tenant_id);
        `);
    } else {
        console.log('[Migrate] ✅ Tablo oluşturuldu!');
    }

    // Tablonun var olup olmadığını kontrol et
    const { data, error: checkErr } = await supabase.from('waitlist').select('id').limit(1);
    if (!checkErr) {
        console.log('[Migrate] ✅ waitlist tablosu erişilebilir durumda.');
    } else {
        console.error('[Migrate] ❌ waitlist tablosuna erişilemiyor:', checkErr.message);
        console.log('[Migrate] SQL Editor\'da yukarıdaki SQL\'i çalıştırdıktan sonra devam edin.');
    }

    process.exit(0);
}

migrate().catch(console.error);
