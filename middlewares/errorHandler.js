'use strict';

const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * @middleware validate
 * @description Middleware de validation express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, err) => {
      if (!acc[err.path]) acc[err.path] = [];
      acc[err.path].push(err.msg);
      return acc;
    }, {});

    return res.status(422).json({
      success: false,
      message: 'Données invalides',
      errors: formattedErrors,
    });
  }
  next();
};

/**
 * @middleware errorHandler
 * @description Gestionnaire d'erreurs global
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message);

  // Erreurs Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.reduce((acc, e) => {
      acc[e.path] = [e.message];
      return acc;
    }, {});
    return res.status(422).json({ success: false, message: 'Données invalides', errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return res.status(409).json({
      success: false,
      message: `Cette valeur est déjà utilisée (${field})`,
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide',
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expiré' });
  }

  // Erreur générique
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Une erreur interne est survenue'
    : err.message || 'Erreur interne';

  return res.status(status).json({ success: false, message });
};

/**
 * @middleware notFound
 * @description Gestionnaire de routes introuvables (404)
 */
const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route introuvable: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  validate,
  errorHandler,
  notFound,
};
