'use strict';

const { body, param, query } = require('express-validator');

/**
 * @validators authValidators
 */

const registerValidator = [
  body('firstname')
    .trim()
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('lastname')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Numéro de téléphone invalide'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis'),
];

const verifyEmailValidator = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('code').trim().notEmpty().withMessage('Le code est requis').isLength({ min: 6, max: 6 }).withMessage('Code à 6 chiffres requis'),
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
];

const resetPasswordValidator = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('code').trim().notEmpty().withMessage('Le code est requis'),
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token requis'),
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
};
