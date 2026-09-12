'use strict';

const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');
const { authenticate, requireVerified, requireAdmin } = require('../middlewares/auth');
const { upload, handleUploadError } = require('../middlewares/upload');
const { validate } = require('../middlewares/errorHandler');
const {
  createQrCodeValidator,
  updateQrCodeValidator,
  getQrCodeValidator,
} = require('../validators/qrValidators');

/**
 * @swagger
 * tags:
 *   name: QR Codes
 *   description: Gestion des QR Codes
 */

// Route publique de prévisualisation (avant création)
router.get('/preview', qrCodeController.previewQrCode);

// Toutes les autres routes requièrent d'être connecté et d'avoir un compte vérifié
router.use(authenticate);
router.use(requireVerified);

router.get('/', qrCodeController.getQrCodes);

router.get('/:id', getQrCodeValidator, validate, qrCodeController.getQrCode);

router.post(
  '/',
  upload.single('logo'),
  handleUploadError,
  (req, res, next) => {
    // Parser le metadata JSON s'il est envoyé en tant que string dans un multipart form
    if (typeof req.body.metadata === 'string') {
      try {
        req.body.metadataStr = req.body.metadata;
      } catch (e) {}
    }
    next();
  },
  createQrCodeValidator,
  validate,
  qrCodeController.createQrCode
);

router.put(
  '/:id',
  upload.single('logo'),
  handleUploadError,
  updateQrCodeValidator,
  validate,
  qrCodeController.updateQrCode
);

router.patch('/:id/toggle', getQrCodeValidator, validate, qrCodeController.toggleQrCode);
router.delete('/:id', getQrCodeValidator, validate, qrCodeController.deleteQrCode);
router.get('/:id/analytics', getQrCodeValidator, validate, qrCodeController.getQrCodeAnalytics);

module.exports = router;
