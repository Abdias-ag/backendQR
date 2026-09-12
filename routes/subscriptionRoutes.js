'use strict';

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { body } = require('express-validator');
const { validate } = require('../middlewares/errorHandler');

router.use(authenticate);

// Obtenir son propre abonnement actif
router.get('/my', subscriptionController.getMySubscription);
// Historique des factures/abonnements
router.get('/history', subscriptionController.getSubscriptionHistory);
// Upgrade / changement de plan
router.post(
  '/upgrade',
  body('plan').isIn(['free', 'starter', 'pro', 'enterprise']).withMessage('Plan invalide'),
  body('paymentMethod').optional().isIn(['card', 'paypal', 'stripe', 'bank', 'free']).withMessage('Moyen de paiement invalide'),
  body('transactionId').optional().trim(),
  validate,
  subscriptionController.upgradePlan
);
// Obtenir la configuration des tarifs
router.get('/plans', subscriptionController.getPlanInfo);

// Route Admin : Voir tous les abonnements
router.get('/admin', requireAdmin, subscriptionController.getAllSubscriptions);
// Route Admin : Changer le plan d'un utilisateur
router.post(
  '/admin/change-plan',
  requireAdmin,
  body('userId').isInt().withMessage('userId invalide'),
  body('plan').isIn(['free', 'starter', 'pro', 'enterprise']).withMessage('Plan invalide'),
  validate,
  subscriptionController.adminChangePlan
);

module.exports = router;
