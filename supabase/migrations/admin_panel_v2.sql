-- =============================================
-- ADMIN PANEL v2 — Database Migration
-- =============================================

-- 1. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- 2. Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    sender_id UUID,
    sender_name VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_msgs_ticket ON ticket_messages(ticket_id);

-- 3. Tenant Notifications
CREATE TABLE IF NOT EXISTS tenant_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_type VARCHAR(20) DEFAULT 'all',
    target_plan_id UUID REFERENCES subscription_plans(id),
    target_tenant_ids UUID[] DEFAULT '{}',
    sent_via VARCHAR(20) DEFAULT 'panel',
    sent_by UUID REFERENCES super_admins(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. White-label branding alanlari
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_primary_color VARCHAR(7) DEFAULT '#c9a84c';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_secondary_color VARCHAR(7) DEFAULT '#111827';

-- 5. RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_notifications ENABLE ROW LEVEL SECURITY;
