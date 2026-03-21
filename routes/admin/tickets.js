const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// GET /api/admin/tickets
router.get('/', async (req, res) => {
    try {
        const { status, priority, tenant_id, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('support_tickets')
            .select('*, tenants(id, name, slug)', { count: 'exact' });

        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (tenant_id) query = query.eq('tenant_id', tenant_id);

        query = query.order('updated_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({ tickets: data, total: count, page: parseInt(page), totalPages: Math.ceil((count || 0) / parseInt(limit)) });
    } catch (err) {
        console.error('[Admin Tickets]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// GET /api/admin/tickets/:id
router.get('/:id', async (req, res) => {
    try {
        const { data: ticket } = await supabase
            .from('support_tickets')
            .select('*, tenants(id, name, slug, phone, email)')
            .eq('id', req.params.id)
            .single();

        if (!ticket) return res.status(404).json({ error: 'Ticket bulunamadı.' });

        const { data: messages } = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', req.params.id)
            .order('created_at', { ascending: true });

        return res.json({ ticket, messages: messages || [] });
    } catch (err) {
        console.error('[Admin Ticket Detail]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// PATCH /api/admin/tickets/:id
router.patch('/:id', async (req, res) => {
    try {
        const allowed = ['status', 'priority'];
        const updates = { updated_at: new Date().toISOString() };
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

        const { data, error } = await supabase.from('support_tickets').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;

        await logActivity({
            actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
            action: 'ticket.updated', targetType: 'ticket', targetId: req.params.id,
            details: updates, ipAddress: req.ip
        });

        return res.json({ ticket: data });
    } catch (err) {
        console.error('[Admin Update Ticket]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/tickets/:id/reply
router.post('/:id/reply', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Mesaj gerekli.' });

        const { data, error } = await supabase.from('ticket_messages').insert([{
            ticket_id: req.params.id,
            sender_type: 'admin',
            sender_id: req.adminId,
            sender_name: req.adminUsername,
            message
        }]).select().single();

        if (error) throw error;

        // Ticket durumunu güncelle
        await supabase.from('support_tickets').update({
            status: 'in_progress',
            updated_at: new Date().toISOString()
        }).eq('id', req.params.id);

        return res.status(201).json({ message: data });
    } catch (err) {
        console.error('[Admin Ticket Reply]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
