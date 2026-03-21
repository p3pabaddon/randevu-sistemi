const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const { logActivity } = require('../lib/activityLog');
const { authenticateSuperAdmin } = require('../middleware/adminAuth');

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
        }

        const { data: admin, error } = await supabase
            .from('super_admins')
            .select('*')
            .eq('username', username.trim().toLowerCase())
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
        }

        if (!admin.is_active) {
            return res.status(403).json({ error: 'Bu hesap devre dışı bırakılmış.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
        }

        // JWT olustur
        const token = jwt.sign(
            { adminId: admin.id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET || 'randevu-sistemi-default-secret-key-xyz-789',
            { expiresIn: '7d' }
        );

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // last_login guncelle
        await supabase.from('super_admins').update({ last_login_at: new Date().toISOString() }).eq('id', admin.id);

        await logActivity({
            actorType: 'super_admin',
            actorId: admin.id,
            actorName: admin.display_name,
            action: 'admin.login',
            details: {},
            ipAddress: req.ip
        });

        const { password: _pw, ...safeAdmin } = admin;
        return res.json({ admin: safeAdmin });
    } catch (err) {
        console.error('[Admin Login]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// POST /api/admin/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('admin_token');
    return res.json({ success: true });
});

// GET /api/admin/auth/me
router.get('/me', authenticateSuperAdmin, async (req, res) => {
    try {
        const { data: admin } = await supabase
            .from('super_admins')
            .select('id, username, email, display_name, role, is_active, last_login_at, created_at')
            .eq('id', req.adminId)
            .single();

        if (!admin) return res.status(404).json({ error: 'Admin bulunamadı.' });
        return res.json({ admin });
    } catch (err) {
        console.error('[Admin Me]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
