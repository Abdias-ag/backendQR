'use strict';

const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const qrRoutes = require('./qrRoutes');
const userRoutes = require('./userRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const notificationRoutes = require('./notificationRoutes');
const settingRoutes = require('./settingRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const qrCodeController = require('../controllers/qrCodeController');
const { scanLimiter } = require('../middlewares/rateLimiter');

// Route publique de redirection dynamique (ex: /q/abc123)
router.get('/q/:slug', scanLimiter, qrCodeController.redirectQrCode);

// Routes de l'API REST
router.use('/api/auth', authRoutes);
router.use('/api/qrcodes', qrRoutes);
router.use('/api/users', userRoutes);
router.use('/api/subscriptions', subscriptionRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/settings', settingRoutes);
router.use('/api/analytics', analyticsRoutes);

module.exports = router;
