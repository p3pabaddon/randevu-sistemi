const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');
const { serviceSchema } = require('../lib/validation');

// GET /api/services/:tenantId (Public - Booking için)
router.get('/:tenantId', async (req, res) => {
    const { data, error } = await supabase
        .from('services')
        .select('*, service_extras(*)')
        .eq('tenant_id', req.params.tenantId)
        .order('name');
    if (error) return res.status(500).json({ error: 'Hizmetler alınamadı.' });

    // Süresi dolmuş kampanyaları geçici olarak sıfırla (DB değiştirmez, sadece yanıt)
    const services = (data || []).map(svc => {
        let updatedSvc = { ...svc };

        // Ana hizmet kampanyası bittiyse sıfırla
        if (updatedSvc.campaign_ends_at && new Date(updatedSvc.campaign_ends_at) <= now) {
            updatedSvc.discounted_price = null;
            updatedSvc.campaign_label = null;
        }

        // Ek hizmet kampanyaları bittiyse sıfırla
        if (updatedSvc.service_extras && updatedSvc.service_extras.length > 0) {
            updatedSvc.service_extras = updatedSvc.service_extras.map(ex => {
                if (ex.campaign_ends_at && new Date(ex.campaign_ends_at) <= now) {
                    return { ...ex, discounted_price: null, campaign_label: null };
                }
                return ex;
            });
        }

        return updatedSvc;
    });

    return res.json({ services });
});

// POST /api/services — yeni hizmet ekle (Admin)
router.post('/', authenticateTenant, async (req, res) => {
    const { error: valError } = serviceSchema.validate(req.body);
    if (valError) return res.status(400).json({ error: valError.details[0].message });

    const { name, duration_minutes, price, discounted_price, description, body_area } = req.body;

    const { data, error } = await supabase
        .from('services')
        .insert([{
            tenant_id: req.tenantId,
            name,
            duration_minutes: duration_minutes || 60,
            price: price || null,
            discounted_price: discounted_price || null,
            description: description || null,
            body_area: body_area || null
        }])
        .select().single();

    if (error) return res.status(500).json({ error: 'Hizmet eklenemedi.' });
    return res.status(201).json({ service: data });
});

// PUT /api/services/:id — hizmeti güncelle (Admin)
router.put('/:id', authenticateTenant, async (req, res) => {
    const { id } = req.params;
    const { name, duration_minutes, price, discounted_price, description, body_area } = req.body;

    // Sahiplik kontrolü
    const { data: existing, error: fetchErr } = await supabase.from('services').select('tenant_id').eq('id', id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: 'Hizmet bulunamadı.' });
    if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkisiz işlem.' });

    const { data, error } = await supabase
        .from('services')
        .update({
            name,
            duration_minutes: duration_minutes || 60,
            price: price != null ? price : null,
            discounted_price: discounted_price != null ? discounted_price : null,
            description: description !== undefined ? description : null,
            body_area: body_area !== undefined ? body_area : null
        })
        .eq('id', id)
        .select().single();

    if (error) return res.status(500).json({ error: 'Güncellenemedi.' });
    return res.json({ service: data });
});

// PATCH /api/services/:id — sadece kampanya alanlarını güncelle
router.patch('/:id', authenticateTenant, async (req, res) => {
    const { id } = req.params;
    const { discounted_price, campaign_label, campaign_ends_at } = req.body;

    const { data: existing, error: fetchErr } = await supabase.from('services').select('tenant_id').eq('id', id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: 'Hizmet bulunamadı.' });
    if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkisiz işlem.' });

    // Tam güncelleme: campaign_label ve campaign_ends_at kolonları da varsa
    const fullUpdate = {};
    if ('discounted_price' in req.body) fullUpdate.discounted_price = discounted_price != null ? Number(discounted_price) : null;
    if ('campaign_label' in req.body) fullUpdate.campaign_label = campaign_label || null;
    if ('campaign_ends_at' in req.body) fullUpdate.campaign_ends_at = campaign_ends_at || null;

    const { data, error } = await supabase.from('services').update(fullUpdate).eq('id', id).select().single();

    if (error) {
        // Kolonlar yoksa (SQL çalıştırılmamış) sadece discounted_price'ı güncelle
        const fallback = {};
        if ('discounted_price' in req.body) fallback.discounted_price = discounted_price != null ? Number(discounted_price) : null;
        const { data: fallbackData, error: fallbackErr } = await supabase
            .from('services').update(fallback).eq('id', id).select().single();
        if (fallbackErr) return res.status(500).json({ error: 'Kampanya güncellenemedi.' });
        return res.json({ service: fallbackData, needs_migration: true });
    }

    return res.json({ service: data });
});

// DELETE /api/services/:id (Admin)
router.delete('/:id', authenticateTenant, async (req, res) => {
    const { id } = req.params;

    // Sahiplik kontrolü
    const { data: existing, error: fetchErr } = await supabase.from('services').select('tenant_id').eq('id', id).single();
    if (fetchErr || !existing) return res.status(404).json({ error: 'Hizmet bulunamadı.' });
    if (existing.tenant_id !== req.tenantId) return res.status(403).json({ error: 'Yetkisiz işlem.' });

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Silinemedi.' });
    return res.json({ success: true });
});

module.exports = router;
