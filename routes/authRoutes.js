'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { authLimiter, emailLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/errorHandler');
const {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
} = require('../validators/authValidators');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentification des utilisateurs
 */

router.post('/register', registerValidator, validate, authController.register);
router.post('/verify-email', emailLimiter, verifyEmailValidator, validate, authController.verifyEmail);
router.post('/resend-verification', emailLimiter, forgotPasswordValidator, validate, authController.resendVerification);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', refreshTokenValidator, validate, authController.refreshToken);
router.post('/forgot-password', emailLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
