const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../../lib/supabase');
const { logActivity } = require('../../lib/activityLog');

// PATCH /api/admin/profile/password
router.patch('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli.' });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'Yeni şifre en az 4 karakter olmalıdır.' });
        }

        const { data: admin } = await supabase
            .from('super_admins')
            .select('id, password')
            .eq('id', req.adminId)
            .single();

        if (!admin) return res.status(404).json({ error: 'Admin bulunamadı.' });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(401).json({ error: 'Mevcut şifre hatalı.' });

        const hashed = await bcrypt.hash(newPassword, 12);
        await supabase.from('super_admins').update({ password: hashed }).eq('id', req.adminId);

        await logActivity({
            actorType: 'super_admin', actorId: req.adminId, actorName: req.adminUsername,
            action: 'admin.password_changed', ipAddress: req.ip
        });

        return res.json({ success: true, message: 'Şifre başarıyla değiştirildi.' });
    } catch (err) {
        console.error('[Admin Change Password]', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
