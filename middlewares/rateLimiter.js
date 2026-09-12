'use strict';

const rateLimit = require('express-rate-limit');

/**
 * @middleware rateLimiter
 * @description Limiteurs de débit pour les routes sensibles
 */

// Limiteur général pour l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer dans 15 minutes.',
  },
  skip: (req) => req.user?.role === 'admin', // Les admins ne sont pas limités
});

// Limiteur strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },
});

// Limiteur pour les emails (forgot password, verify)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop d\'emails envoyés. Réessayez dans 1 heure.',
  },
});

// Limiteur pour le scan de QR Codes (public)
const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de scans. Réessayez dans 1 minute.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  emailLimiter,
  scanLimiter,
};
