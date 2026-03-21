const express = require('express');
const router = express.Router();
const supabase = require('../../lib/supabase');

// GET /api/admin/logs
router.get('/', async (req, res) => {
    try {
        const { action, actor_id, target_type, from, to, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
            .from('activity_logs')
            .select('*', { count: 'exact' });

        if (action) query = query.eq('action', action);
        if (actor_id) query = query.eq('actor_id', actor_id);
        if (target_type) query = query.eq('target_type', target_type);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to + 'T23:59:59');

        query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return res.json({
            logs: data,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil((count || 0) / parseInt(limit))
        });
    } catch (err) {
        console.error('[Admin Logs]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
