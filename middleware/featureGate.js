const supabase = require('../lib/supabase');

function requireFeature(featureName) {
    return async (req, res, next) => {
        try {
            const tenantId = req.tenantId;
            if (!tenantId) return next(); // Public endpoint, skip

            const { data: tenant } = await supabase
                .from('tenants')
                .select('current_plan_id, is_active, subscription_expires_at')
                .eq('id', tenantId)
                .single();

            if (!tenant) return next();

            // Plan atanmamissa izin ver (legacy tenant)
            if (!tenant.current_plan_id) return next();

            // Abonelik suresi kontrolu
            if (tenant.subscription_expires_at) {
                const now = new Date().toISOString().split('T')[0];
                if (tenant.subscription_expires_at < now) {
                    return res.status(403).json({
                        error: 'Abonelik süreniz dolmuş. Lütfen yöneticinizle iletişime geçin.',
                        subscription_expired: true
                    });
                }
            }

            // Tenant aktif mi
            if (tenant.is_active === false) {
                return res.status(403).json({
                    error: 'Hesabınız askıya alınmış. Lütfen yöneticinizle iletişime geçin.',
                    account_suspended: true
                });
            }

            // Feature kontrolu
            const { data: plan } = await supabase
                .from('subscription_plans')
                .select('features')
                .eq('id', tenant.current_plan_id)
                .single();

            if (!plan || !plan.features || !plan.features[featureName]) {
                return res.status(403).json({
                    error: 'Bu özellik mevcut paketinizde bulunmamaktadır.',
                    required_feature: featureName,
                    upgrade_required: true
                });
            }

            next();
        } catch (err) {
            console.error('[FeatureGate] Hata:', err.message);
            next(); // Hata durumunda izin ver (fail-open)
        }
    };
}

module.exports = { requireFeature };
