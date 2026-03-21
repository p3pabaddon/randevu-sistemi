const express = require('express');
const router = express.Router();
const { authenticateSuperAdmin } = require('../../middleware/adminAuth');

const adminAuthRouter = require('../adminAuth');
const tenantsRouter = require('./tenants');
const plansRouter = require('./plans');
const subscriptionsRouter = require('./subscriptions');
const paymentsRouter = require('./payments');
const logsRouter = require('./logs');
const analyticsRouter = require('./analytics');
const profileRouter = require('./profile');
const bulkRouter = require('./bulk');
const exportRouter = require('./export');
const notificationsRouter = require('./notifications');
const ticketsRouter = require('./tickets');
const brandingRouter = require('./branding');

// Auth routes (login is public)
router.use('/auth', adminAuthRouter);

// Protected routes
router.use('/tenants', authenticateSuperAdmin, tenantsRouter);
router.use('/plans', authenticateSuperAdmin, plansRouter);
router.use('/subscriptions', authenticateSuperAdmin, subscriptionsRouter);
router.use('/payments', authenticateSuperAdmin, paymentsRouter);
router.use('/logs', authenticateSuperAdmin, logsRouter);
router.use('/analytics', authenticateSuperAdmin, analyticsRouter);
router.use('/profile', authenticateSuperAdmin, profileRouter);
router.use('/bulk', authenticateSuperAdmin, bulkRouter);
router.use('/export', authenticateSuperAdmin, exportRouter);
router.use('/notifications', authenticateSuperAdmin, notificationsRouter);
router.use('/tickets', authenticateSuperAdmin, ticketsRouter);
router.use('/branding', authenticateSuperAdmin, brandingRouter);

module.exports = router;
