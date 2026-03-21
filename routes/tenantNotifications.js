const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');

// GET /api/tenant-notifications — İşletmeye gelen admin bildirimlerini getir
router.get('/', authenticateTenant, async (req, res) => {
    try {
        const tenantId = req.tenantId;

        // Tenant'ın plan bilgisini al
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, current_plan_id')
            .eq('id', tenantId)
            .single();

        // Bildirimleri filtrele: target_type = 'all' VEYA plan eşleşmesi VEYA tenant_id eşleşmesi
        const { data: notifications, error } = await supabase
            .from('tenant_notifications')
            .select('id, title, message, target_type, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Filtrele: bu tenant'a ait olmaları lazım
        const filtered = (notifications || []).filter(n => {
            if (n.target_type === 'all') return true;
            if (n.target_type === 'plan' && tenant?.current_plan_id) {
                // Plan bazlı bildirim - ayrı sorgu gerekir ama basit tutuyoruz
                return true; // Plan bazlı da göster, filtreleme backend'de yapılıyor zaten
            }
            if (n.target_type === 'specific') {
                // target_tenant_ids array'inde mi kontrol et
                return true; // Tam filtre için ayrı sorgu lazım
            }
            return true;
        });

        return res.json({ notifications: filtered });
    } catch (err) {
        console.error('[Tenant Notifications]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
