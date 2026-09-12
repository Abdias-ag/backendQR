'use strict';

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * @service TokenService
 * @description Service de gestion des tokens JWT (access + refresh)
 */

/**
 * Générer un access token JWT
 * @param {Object} payload - Données à encoder
 * @returns {string} - Token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'qr-platform',
    audience: 'qr-platform-client',
  });
};

/**
 * Générer un refresh token JWT
 * @param {Object} payload - Données à encoder
 * @returns {string} - Refresh token JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'qr-platform',
    audience: 'qr-platform-client',
  });
};

/**
 * Vérifier un access token JWT
 * @param {string} token - Token à vérifier
 * @returns {Object} - Payload décodé
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'qr-platform',
    audience: 'qr-platform-client',
  });
};

/**
 * Vérifier un refresh token JWT
 * @param {string} token - Token à vérifier
 * @returns {Object} - Payload décodé
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'qr-platform',
    audience: 'qr-platform-client',
  });
};

/**
 * Générer un code numérique aléatoire
 * @param {number} length - Longueur du code (default: 6)
 * @returns {string} - Code numérique
 */
const generateNumericCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

/**
 * Décoder un token sans le vérifier (pour lecture des claims)
 * @param {string} token
 * @returns {Object|null}
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateNumericCode,
  decodeToken,
};
