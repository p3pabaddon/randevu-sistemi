const jwt = require('jsonwebtoken');

const authenticateSuperAdmin = (req, res, next) => {
    const token = req.cookies.admin_token;

    if (!token) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Admin girişi gerekli.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'randevu-sistemi-default-secret-key-xyz-789');
        if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
            return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli.' });
        }
        req.adminId = decoded.adminId;
        req.adminUsername = decoded.username;
        req.adminRole = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz token.' });
    }
};

module.exports = { authenticateSuperAdmin };
