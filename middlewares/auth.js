'use strict';

const { verifyAccessToken } = require('../services/tokenService');
const { User } = require('../models');
const { errorResponse } = require('../utils/response');

/**
 * @middleware authenticate
 * @description Vérifier le JWT et charger l'utilisateur courant
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token d\'authentification requis', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Token manquant', 401);
    }

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expiré. Veuillez vous reconnecter.', 401, 'TOKEN_EXPIRED');
      }
      return errorResponse(res, 'Token invalide', 401);
    }

    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'verificationCode', 'resetPasswordCode', 'refreshToken'] },
    });

    if (!user) {
      return errorResponse(res, 'Utilisateur introuvable', 401);
    }

    if (user.status === 'banned') {
      return errorResponse(res, 'Compte banni. Contactez le support.', 403);
    }

    if (user.status === 'inactive') {
      return errorResponse(res, 'Compte inactif. Veuillez le réactiver.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Erreur d\'authentification', 500);
  }
};

/**
 * @middleware requireAdmin
 * @description Vérifier que l'utilisateur est administrateur
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return errorResponse(res, 'Accès réservé aux administrateurs', 403);
  }
  next();
};

/**
 * @middleware requireVerified
 * @description Vérifier que l'utilisateur a vérifié son email
 */
const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return errorResponse(res, 'Veuillez vérifier votre adresse email d\'abord', 403, 'EMAIL_NOT_VERIFIED');
  }
  next();
};

/**
 * @middleware optionalAuth
 * @description Authentification optionnelle (ne bloque pas si pas de token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'verificationCode', 'resetPasswordCode', 'refreshToken'] },
    });

    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch {
    // Ignorer les erreurs silencieusement
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireVerified,
  optionalAuth,
};
