-- =============================================
-- SUPER ADMIN PANEL - Database Migration
-- =============================================

-- 1. Super Admins tablosu
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Subscription Plans tablosu
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    features JSONB NOT NULL DEFAULT '{}',
    max_staff INTEGER DEFAULT NULL,
    max_branches INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tenant Subscriptions tablosu
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    starts_at DATE NOT NULL,
    expires_at DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES super_admins(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_sub_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_sub_expires ON tenant_subscriptions(expires_at);

-- 4. Payments tablosu
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES tenant_subscriptions(id),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_method VARCHAR(50) DEFAULT 'manual',
    status VARCHAR(20) DEFAULT 'pending',
    payment_date DATE,
    due_date DATE,
    invoice_number VARCHAR(50),
    notes TEXT,
    recorded_by UUID REFERENCES super_admins(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due ON payments(due_date);

-- 5. Activity Logs tablosu
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_type VARCHAR(20) NOT NULL,
    actor_id UUID,
    actor_name VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_target ON activity_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);

-- 6. Tenants tablosuna yeni kolonlar
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS current_plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. RLS acik
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 8. Seed: 3 Paket
INSERT INTO subscription_plans (name, slug, price_monthly, features, max_branches, sort_order) VALUES
('Standart', 'standart', 3500.00, '{
    "online_booking": true,
    "customer_records": true,
    "unlimited_services": true,
    "auto_reminders": true,
    "basic_stats": true,
    "support_24_7": true,
    "whatsapp_api": false,
    "auto_confirm": false,
    "staff_management": false,
    "advanced_reports": false,
    "priority_support": false,
    "multi_branch": false,
    "custom_domain": false,
    "custom_integrations": false,
    "corporate_training": false
}', 1, 1),
('Profesyonel', 'profesyonel', 5000.00, '{
    "online_booking": true,
    "customer_records": true,
    "unlimited_services": true,
    "auto_reminders": true,
    "basic_stats": true,
    "support_24_7": true,
    "whatsapp_api": true,
    "auto_confirm": true,
    "staff_management": true,
    "advanced_reports": true,
    "priority_support": true,
    "multi_branch": false,
    "custom_domain": false,
    "custom_integrations": false,
    "corporate_training": false
}', 1, 2),
('Kurumsal', 'kurumsal', 8000.00, '{
    "online_booking": true,
    "customer_records": true,
    "unlimited_services": true,
    "auto_reminders": true,
    "basic_stats": true,
    "support_24_7": true,
    "whatsapp_api": true,
    "auto_confirm": true,
    "staff_management": true,
    "advanced_reports": true,
    "priority_support": true,
    "multi_branch": true,
    "custom_domain": true,
    "custom_integrations": true,
    "corporate_training": true
}', 999, 3)
ON CONFLICT (slug) DO NOTHING;

-- 9. Seed: Super Admin (sifre: admin123 — bcrypt hash)
-- $2a$12$LJ3a4FhZfV0D2k3R5q8oOeQGqXzJp8K0yvBnN5L7rP3oT1U2W4X6Y
-- NOT: Gercek hash server tarafinda olusturulacak, bu placeholder
