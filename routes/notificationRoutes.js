'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/errorHandler');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', param('id').isInt().withMessage('ID invalide'), validate, notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:id', param('id').isInt().withMessage('ID invalide'), validate, notificationController.deleteNotification);

// Admin route to create notifications manually for users
router.post(
  '/admin',
  requireAdmin,
  body('userId').isInt().withMessage('ID utilisateur requis'),
  body('title').trim().notEmpty().withMessage('Le titre est requis'),
  body('message').trim().notEmpty().withMessage('Le message est requis'),
  body('type').optional().isIn(['info', 'success', 'warning', 'error', 'promo']).withMessage('Type invalide'),
  body('actionUrl').optional().trim(),
  body('actionLabel').optional().trim(),
  validate,
  notificationController.createNotification
);

module.exports = router;
