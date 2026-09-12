'use strict';

const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate } = require('../middlewares/auth');
const { body } = require('express-validator');
const { validate } = require('../middlewares/errorHandler');

router.use(authenticate);

router.get('/', settingController.getSettings);
router.put(
  '/',
  body('language').optional().isIn(['fr', 'en', 'es', 'de', 'ar', 'pt']).withMessage('Langue non supportée'),
  body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Thème invalide'),
  body('timezone').optional().trim().notEmpty().withMessage('Fuseau horaire requis'),
  body('emailNotifications').optional().isBoolean().withMessage('emailNotifications doit être un booléen'),
  body('pushNotifications').optional().isBoolean().withMessage('pushNotifications doit être un booléen'),
  body('weeklyReport').optional().isBoolean().withMessage('weeklyReport doit être un booléen'),
  body('dateFormat').optional().trim().notEmpty().withMessage('Format de date requis'),
  validate,
  settingController.updateSettings
);

module.exports = router;
