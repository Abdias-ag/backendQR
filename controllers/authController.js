'use strict';

const { User, Setting, Notification } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateNumericCode } = require('../services/tokenService');
const { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } = require('../services/emailService');

/**
 * @controller AuthController
 * @description Gestion de l'authentification (register, login, logout, etc.)
 */

/**
 * POST /api/auth/register
 * Créer un nouveau compte utilisateur
 */
const register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, phone } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.unscoped().findOne({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 'Cet email est déjà utilisé', 409);
    }

    // Générer le code de vérification
    const verificationCode = generateNumericCode(6);
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Créer l'utilisateur
    const user = await User.create({
      firstname,
      lastname,
      email,
      password,
      phone: phone || null,
      verificationCode,
      verificationCodeExpires,
      isVerified: false,
      status: 'active',
      plan: 'free',
      role: 'user',
    });

    // Créer les paramètres par défaut
    await Setting.create({ userId: user.id });

    // Créer la notification de bienvenue
    await Notification.create({
      userId: user.id,
      title: 'Bienvenue sur QR Platform !',
      message: 'Votre compte a été créé. Vérifiez votre email pour l\'activer.',
      type: 'info',
    });

    // Afficher le code de vérification dans le terminal (debug/dev)
    console.log(`Code vérification pour ${email} (user ${user.id}): ${verificationCode}`);

    // Envoyer l'email de vérification
    let emailSent = false;
    try {
      await sendVerificationEmail(email, firstname, verificationCode);
      emailSent = true;
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError.message);
    }

    return successResponse(
      res,
      'Compte créé avec succès. Vérifiez votre email.',
      {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        isVerified: user.isVerified,
        emailSent,
        ...(process.env.NODE_ENV !== 'production' && !emailSent ? { devVerificationCode: verificationCode } : {}),
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, error.message || 'Erreur lors de la création du compte', 500);
  }
};

/**
 * POST /api/auth/verify-email
 * Vérifier l'email avec le code envoyé
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.scope('withTokens').findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Utilisateur introuvable', 404);
    }

    if (user.isVerified) {
      return errorResponse(res, 'Email déjà vérifié', 400);
    }

    if (user.verificationCode !== code) {
      return errorResponse(res, 'Code de vérification invalide', 400);
    }

    if (user.verificationCodeExpires && new Date() > new Date(user.verificationCodeExpires)) {
      return errorResponse(res, 'Code expiré. Demandez un nouveau code.', 400, 'CODE_EXPIRED');
    }

    // Marquer comme vérifié
    await user.update({
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    });

    // Envoyer l'email de bienvenue
    try {
      await sendWelcomeEmail(email, user.firstname);
    } catch {}

    // Générer les tokens
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await user.update({ refreshToken, lastLoginAt: new Date() });

    return successResponse(res, 'Email vérifié avec succès', {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        plan: user.plan,
        role: user.role,
        isVerified: true,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return errorResponse(res, 'Erreur de vérification', 500);
  }
};

/**
 * POST /api/auth/resend-verification
 * Renvoyer le code de vérification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.scope('withTokens').findOne({ where: { email } });
    if (!user) {
      return successResponse(res, 'Si cet email existe, un code a été envoyé.'); // Security
    }

    if (user.isVerified) {
      return errorResponse(res, 'Email déjà vérifié', 400);
    }

    const verificationCode = generateNumericCode(6);
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.update({ verificationCode, verificationCodeExpires });

    // Afficher le code de vérification dans le terminal (debug/dev)
    console.log(`Code renvoyé pour ${email} (user ${user.id}): ${verificationCode}`);

    try {
      await sendVerificationEmail(email, user.firstname, verificationCode);
    } catch (e) {
      console.error('Erreur email:', e.message);
    }

    return successResponse(res, 'Code de vérification renvoyé.');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de l\'envoi', 500);
  }
};

/**
 * POST /api/auth/login
 * Connecter un utilisateur
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 [BACKEND] Login request reçue:', { email, ip: req.ip, headers: req.headers });

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.scope('withTokens').findOne({ where: { email } });
    console.log('🔐 [BACKEND] Utilisateur trouvé:', user ? `ID ${user.id}` : 'NOT FOUND');
    if (!user) {
      return errorResponse(res, 'Email ou mot de passe incorrect', 401);
    }

    if (user.status === 'banned') {
      return errorResponse(res, 'Compte banni. Contactez le support.', 403);
    }

    if (user.status === 'inactive') {
      return errorResponse(res, 'Compte inactif', 403);
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Email ou mot de passe incorrect', 401);
    }

    // Générer les tokens
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await user.update({ refreshToken, lastLoginAt: new Date() });

    console.log('✅ [BACKEND] Login réussi, tokens générés');
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑 [BACKEND] Access token:', accessToken);
    }
    return successResponse(res, 'Connexion réussie', {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        plan: user.plan,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('❌ [BACKEND] Login error:', error.message, error.stack);
    return errorResponse(res, 'Erreur de connexion', 500);
  }
};

/**
 * POST /api/auth/logout
 * Déconnecter l'utilisateur (invalider le refresh token)
 */
const logout = async (req, res) => {
  try {
    await User.unscoped().update(
      { refreshToken: null },
      { where: { id: req.user.id } }
    );

    return successResponse(res, 'Déconnexion réussie');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la déconnexion', 500);
  }
};

/**
 * POST /api/auth/refresh
 * Renouveler l'access token avec le refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return errorResponse(res, 'Refresh token requis', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return errorResponse(res, 'Refresh token invalide ou expiré', 401);
    }

    const user = await User.scope('withTokens').findByPk(decoded.id);
    if (!user || user.refreshToken !== token) {
      return errorResponse(res, 'Refresh token invalide', 401);
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await user.update({ refreshToken: newRefreshToken });

    return successResponse(res, 'Token renouvelé', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return errorResponse(res, 'Erreur de renouvellement du token', 500);
  }
};

/**
 * POST /api/auth/forgot-password
 * Demander la réinitialisation du mot de passe
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.scope('withTokens').findOne({ where: { email } });

    // Toujours renvoyer la même réponse (sécurité)
    if (!user) {
      return successResponse(res, 'Si cet email existe, un code a été envoyé.');
    }

    const resetPasswordCode = generateNumericCode(6);
    const resetPasswordCodeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await user.update({ resetPasswordCode, resetPasswordCodeExpires });

    try {
      await sendResetPasswordEmail(email, user.firstname, resetPasswordCode);
    } catch (e) {
      console.error('Erreur email reset:', e.message);
    }

    return successResponse(res, 'Si cet email existe, un code a été envoyé.');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la demande de réinitialisation', 500);
  }
};

/**
 * POST /api/auth/reset-password
 * Réinitialiser le mot de passe avec le code
 */
const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    const user = await User.scope('withTokens').findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 'Utilisateur introuvable', 404);
    }

    if (user.resetPasswordCode !== code) {
      return errorResponse(res, 'Code de réinitialisation invalide', 400);
    }

    if (user.resetPasswordCodeExpires && new Date() > new Date(user.resetPasswordCodeExpires)) {
      return errorResponse(res, 'Code expiré. Demandez un nouveau code.', 400, 'CODE_EXPIRED');
    }

    await user.update({
      password, // Le hook beforeUpdate hashera automatiquement
      resetPasswordCode: null,
      resetPasswordCodeExpires: null,
      refreshToken: null, // Invalider toutes les sessions
    });

    return successResponse(res, 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la réinitialisation', 500);
  }
};

/**
 * GET /api/auth/me
 * Obtenir le profil de l'utilisateur connecté
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          association: 'settings',
          attributes: ['language', 'theme', 'timezone', 'emailNotifications', 'pushNotifications'],
        },
      ],
    });

    return successResponse(res, 'Profil récupéré', user);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération du profil', 500);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
