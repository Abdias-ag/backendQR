'use strict';

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate);

// User dashboard stats
router.get('/dashboard', analyticsController.getDashboardStats);

// Admin overall stats
router.get('/admin', requireAdmin, analyticsController.getAdminStats);

module.exports = router;
