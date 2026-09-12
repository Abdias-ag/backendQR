'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const activityController = require('../controllers/activityController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { upload, handleUploadError } = require('../middlewares/upload');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/errorHandler');

// Validation du changement de mot de passe
const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
];

// Validation de mise à jour de profil
const updateProfileValidator = [
  body('firstname').optional().trim().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('lastname').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('phone').optional().trim().isMobilePhone().withMessage('Numéro de téléphone invalide'),
];

// Routes Utilisateur Connecté
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put(
  '/profile',
  upload.single('avatar'),
  handleUploadError,
  updateProfileValidator,
  validate,
  userController.updateProfile
);
router.put('/password', changePasswordValidator, validate, userController.changePassword);
router.delete('/profile', body('password').notEmpty().withMessage('Le mot de passe est requis'), validate, userController.deleteAccount);

// Routes Admin
router.get('/admin/users', requireAdmin, userController.getAllUsers);
router.get('/admin/users/:id', requireAdmin, param('id').isInt().withMessage('ID invalide'), validate, userController.getUserById);
router.patch(
  '/admin/users/:id/status',
  requireAdmin,
  param('id').isInt().withMessage('ID invalide'),
  body('status').isIn(['active', 'inactive', 'banned']).withMessage('Statut invalide'),
  validate,
  userController.updateUserStatus
);
router.patch(
  '/admin/users/:id/verify-email',
  requireAdmin,
  param('id').isInt().withMessage('ID invalide'),
  validate,
  userController.verifyUserEmail
);
router.delete('/admin/users/:id', requireAdmin, param('id').isInt().withMessage('ID invalide'), validate, userController.deleteUser);

// Routes Admin : Journal d'activite
router.get('/admin/activity', requireAdmin, activityController.getActivityLog);
router.get('/admin/activity/stats', requireAdmin, activityController.getActivityStats);

module.exports = router;
