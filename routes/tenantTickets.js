const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticateTenant } = require('../middleware/auth');

// GET /api/tickets/my — Kendi ticketlarım
router.get('/my', authenticateTenant, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('tenant_id', req.tenantId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return res.json({ tickets: data });
    } catch (err) {
        console.error('[Tenant Tickets]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/tickets — Yeni ticket
router.post('/', authenticateTenant, async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) return res.status(400).json({ error: 'Konu ve mesaj gerekli.' });

        const { data: ticket, error } = await supabase.from('support_tickets').insert([{
            tenant_id: req.tenantId,
            subject,
            status: 'open',
            priority: 'normal'
        }]).select().single();

        if (error) throw error;

        // İlk mesajı ekle
        await supabase.from('ticket_messages').insert([{
            ticket_id: ticket.id,
            sender_type: 'tenant',
            sender_id: req.tenantId,
            sender_name: req.tenantSlug,
            message
        }]);

        return res.status(201).json({ ticket });
    } catch (err) {
        console.error('[Tenant Create Ticket]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/tickets/:id — Ticket detay
router.get('/:id', authenticateTenant, async (req, res) => {
    try {
        const { data: ticket } = await supabase
            .from('support_tickets').select('*')
            .eq('id', req.params.id).eq('tenant_id', req.tenantId).single();

        if (!ticket) return res.status(404).json({ error: 'Ticket bulunamadı.' });

        const { data: messages } = await supabase
            .from('ticket_messages').select('*')
            .eq('ticket_id', req.params.id)
            .order('created_at', { ascending: true });

        return res.json({ ticket, messages: messages || [] });
    } catch (err) {
        console.error('[Tenant Ticket Detail]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/tickets/:id/reply — Yanıt ekle
router.post('/:id/reply', authenticateTenant, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Mesaj gerekli.' });

        // Ownership kontrolü
        const { data: ticket } = await supabase
            .from('support_tickets').select('id')
            .eq('id', req.params.id).eq('tenant_id', req.tenantId).single();

        if (!ticket) return res.status(404).json({ error: 'Ticket bulunamadı.' });

        const { data, error } = await supabase.from('ticket_messages').insert([{
            ticket_id: req.params.id,
            sender_type: 'tenant',
            sender_id: req.tenantId,
            sender_name: req.tenantSlug,
            message
        }]).select().single();

        if (error) throw error;

        await supabase.from('support_tickets').update({
            status: 'open', updated_at: new Date().toISOString()
        }).eq('id', req.params.id);

        return res.status(201).json({ message: data });
    } catch (err) {
        console.error('[Tenant Ticket Reply]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// DELETE /api/tickets/:id — Ticket sil (sadece kendi ticket'ı)
router.delete('/:id', authenticateTenant, async (req, res) => {
    try {
        const { data: ticket } = await supabase
            .from('support_tickets').select('id')
            .eq('id', req.params.id).eq('tenant_id', req.tenantId).single();

        if (!ticket) return res.status(404).json({ error: 'Ticket bulunamadı.' });

        await supabase.from('ticket_messages').delete().eq('ticket_id', req.params.id);
        const { error } = await supabase.from('support_tickets').delete().eq('id', req.params.id);
        if (error) throw error;

        return res.json({ success: true });
    } catch (err) {
        console.error('[Tenant Delete Ticket]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
