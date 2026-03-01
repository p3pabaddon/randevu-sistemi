const jwt = require('jsonwebtoken');

const authenticateTenant = (req, res, next) => {
    const token = req.cookies.randevu_token;

    if (!token) {
        return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'randevu-sistemi-default-secret-key-xyz-789');
        req.tenantId = decoded.tenantId;
        req.tenantSlug = decoded.tenantSlug;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Oturum süresi dolmuş veya geçersiz token.' });
    }
};

module.exports = { authenticateTenant };
