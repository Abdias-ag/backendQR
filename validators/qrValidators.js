'use strict';

const { body, param, query } = require('express-validator');

/**
 * @validators qrValidators
 */

const createQrCodeValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom du QR Code est requis')
    .isLength({ max: 255 }).withMessage('Le nom ne doit pas dépasser 255 caractères'),
  body('type')
    .notEmpty().withMessage('Le type de QR Code est requis')
    .isIn([
      'url', 'text', 'phone', 'sms', 'email', 'whatsapp',
      'wifi', 'vcard', 'location', 'pdf', 'image', 'video', 'download'
    ]).withMessage('Type de QR Code invalide'),
  body('foregroundColor')
    .optional()
    .isHexColor().withMessage('La couleur de premier plan doit être une couleur hexadécimale valide'),
  body('backgroundColor')
    .optional()
    .isHexColor().withMessage('La couleur de fond doit être une couleur hexadécimale valide'),
  body('size')
    .optional()
    .isInt({ min: 100, max: 1000 }).withMessage('La taille doit être comprise entre 100 et 1000 pixels'),
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601().withMessage('Date d\'expiration invalide (format ISO requis)'),
];

const updateQrCodeValidator = [
  param('id')
    .isInt().withMessage('ID de QR Code invalide'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Le nom du QR Code ne peut pas être vide')
    .isLength({ max: 255 }).withMessage('Le nom ne doit pas dépasser 255 caractères'),
  body('type')
    .optional()
    .isIn([
      'url', 'text', 'phone', 'sms', 'email', 'whatsapp',
      'wifi', 'vcard', 'location', 'pdf', 'image', 'video', 'download'
    ]).withMessage('Type de QR Code invalide'),
  body('foregroundColor')
    .optional()
    .isHexColor().withMessage('La couleur de premier plan doit être une couleur hexadécimale valide'),
  body('backgroundColor')
    .optional()
    .isHexColor().withMessage('La couleur de fond doit être une couleur hexadécimale valide'),
  body('size')
    .optional()
    .isInt({ min: 100, max: 1000 }).withMessage('La taille doit être comprise entre 100 et 1000 pixels'),
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601().withMessage('Date d\'expiration invalide (format ISO requis)'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('La valeur isActive doit être un booléen'),
];

const getQrCodeValidator = [
  param('id').isInt().withMessage('ID de QR Code invalide'),
];

module.exports = {
  createQrCodeValidator,
  updateQrCodeValidator,
  getQrCodeValidator,
};
