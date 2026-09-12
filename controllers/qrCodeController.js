'use strict';

const { QrCode, QrScan, User } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getPagination, getSorting, getSearch } = require('../utils/pagination');
const { generateQRImage, generateQRBase64, buildQRContent, generateSlug, deleteQRImage } = require('../services/qrService');
const { extractScanData } = require('../helpers/scanHelper');

/**
 * @controller QrCodeController
 * @description CRUD complet pour les QR Codes + scan tracking
 */

/**
 * GET /api/qrcodes
 * Lister les QR Codes de l'utilisateur connecté
 */
const getQrCodes = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const order = getSorting(req.query, ['name', 'scanCount', 'createdAt', 'type'], 'createdAt');
    const search = getSearch(req.query);

    const where = { userId: req.user.id };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
      ];
    }

    if (req.query.type) where.type = req.query.type;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const { count, rows } = await QrCode.findAndCountAll({
      where,
      order,
      limit,
      offset,
    });

    return paginatedResponse(res, 'QR Codes récupérés', rows, { page, limit, total: count });
  } catch (error) {
    console.error('getQrCodes error:', error);
    return errorResponse(res, 'Erreur lors de la récupération des QR Codes', 500);
  }
};

/**
 * GET /api/qrcodes/:id
 * Obtenir un QR Code par son ID
 */
const getQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!qrCode) {
      return errorResponse(res, 'QR Code introuvable', 404);
    }

    return successResponse(res, 'QR Code récupéré', qrCode);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * POST /api/qrcodes
 * Créer un nouveau QR Code dynamique
 */
const createQrCode = async (req, res) => {
  try {
    const {
      name, type, foregroundColor, backgroundColor, size, metadata, expiresAt,
    } = req.body;

    // Générer un slug unique
    let slug;
    let slugExists = true;
    let attempts = 0;
    while (slugExists && attempts < 10) {
      slug = generateSlug(8);
      slugExists = await QrCode.findOne({ where: { slug } });
      attempts++;
    }

    if (!slug) {
      return errorResponse(res, 'Erreur de génération du slug', 500);
    }

    // Construire le contenu selon le type
    const content = buildQRContent(type, req.body);
    if (!content) {
      return errorResponse(res, 'Contenu du QR Code requis', 400);
    }

    // Utiliser une URL publique explicite si elle est configurée.
    // Sinon, on prend l'URL réelle de la requête (IP/LAN/public domain),
    // ce qui évite d'encoder localhost dans un QR scanné depuis un téléphone.
    const configuredQrBaseUrl = process.env.QR_BASE_URL?.trim();
    const configuredAppUrl = process.env.APP_URL?.trim();
    const forwardedHost = req.get('x-forwarded-host');
    const requestHost = forwardedHost || req.get('host');
    const requestProtocol = req.get('x-forwarded-proto') || req.protocol;

    let qrBaseUrl = `${requestProtocol}://${requestHost}/q`;

    if (configuredQrBaseUrl && !/localhost|127\.0\.0\.1/.test(configuredQrBaseUrl)) {
      qrBaseUrl = configuredQrBaseUrl.replace(/\/$/, '').endsWith('/q')
        ? configuredQrBaseUrl.replace(/\/$/, '')
        : `${configuredQrBaseUrl.replace(/\/$/, '')}/q`;
    } else if (configuredAppUrl && !/localhost|127\.0\.0\.1/.test(configuredAppUrl)) {
      qrBaseUrl = `${configuredAppUrl.replace(/\/$/, '')}/q`;
    }

    const dynamicUrl = `${qrBaseUrl.replace(/\/$/, '')}/${slug}`;

    // Générer l'image QR Code (encode l'URL dynamique, pas le contenu réel)
    const qrImagePath = await generateQRImage(dynamicUrl, {
      foregroundColor: foregroundColor || '#000000',
      backgroundColor: backgroundColor || '#FFFFFF',
      size: size || 300,
    });

    // Gérer le logo uploadé
    const logo = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const qrCode = await QrCode.create({
      userId: req.user.id,
      name,
      type,
      content,
      dynamicUrl,
      slug,
      foregroundColor: foregroundColor || '#000000',
      backgroundColor: backgroundColor || '#FFFFFF',
      logo,
      qrImage: qrImagePath,
      size: size || 300,
      metadata: metadata ? JSON.parse(metadata) : null,
      expiresAt: expiresAt || null,
    });

    return successResponse(res, 'QR Code créé avec succès', qrCode, 201);
  } catch (error) {
    console.error('createQrCode error:', error);
    return errorResponse(res, error.message || 'Erreur lors de la création du QR Code', 500);
  }
};

/**
 * PUT /api/qrcodes/:id
 * Mettre à jour un QR Code
 */
const updateQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!qrCode) {
      return errorResponse(res, 'QR Code introuvable', 404);
    }

    const {
      name, type, foregroundColor, backgroundColor, size, metadata, expiresAt, isActive,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
    if (metadata !== undefined) updateData.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

    // Si le type ou contenu change, reconstruire et régénérer l'image
    const newFgColor = foregroundColor || qrCode.foregroundColor;
    const newBgColor = backgroundColor || qrCode.backgroundColor;
    const newSize = size || qrCode.size;
    const shouldRegenerate = (
      type !== undefined ||
      foregroundColor !== undefined ||
      backgroundColor !== undefined ||
      size !== undefined
    );

    if (shouldRegenerate) {
      if (type !== undefined) {
        updateData.type = type;
        updateData.content = buildQRContent(type, req.body);
      }
      if (foregroundColor) updateData.foregroundColor = newFgColor;
      if (backgroundColor) updateData.backgroundColor = newBgColor;
      if (size) updateData.size = newSize;

      // Régénérer l'image QR Code
      if (qrCode.qrImage) deleteQRImage(qrCode.qrImage);

      const newQrImage = await generateQRImage(qrCode.dynamicUrl, {
        foregroundColor: newFgColor,
        backgroundColor: newBgColor,
        size: newSize,
      });
      updateData.qrImage = newQrImage;
    }

    // Nouveau logo uploadé
    if (req.file) {
      if (qrCode.logo) deleteQRImage(qrCode.logo);
      updateData.logo = `/uploads/logos/${req.file.filename}`;
    }

    await qrCode.update(updateData);
    await qrCode.reload();

    return successResponse(res, 'QR Code mis à jour', qrCode);
  } catch (error) {
    console.error('updateQrCode error:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour', 500);
  }
};

/**
 * PATCH /api/qrcodes/:id/toggle
 * Activer/désactiver un QR Code
 */
const toggleQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!qrCode) {
      return errorResponse(res, 'QR Code introuvable', 404);
    }

    await qrCode.update({ isActive: !qrCode.isActive });

    return successResponse(res, `QR Code ${qrCode.isActive ? 'activé' : 'désactivé'}`, {
      id: qrCode.id,
      isActive: qrCode.isActive,
    });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 500);
  }
};

/**
 * DELETE /api/qrcodes/:id
 * Supprimer un QR Code
 */
const deleteQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!qrCode) {
      return errorResponse(res, 'QR Code introuvable', 404);
    }

    // Supprimer les images associées
    if (qrCode.qrImage) deleteQRImage(qrCode.qrImage);
    if (qrCode.logo) deleteQRImage(qrCode.logo);

    await qrCode.destroy();

    return successResponse(res, 'QR Code supprimé avec succès');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la suppression', 500);
  }
};

/**
 * GET /api/qrcodes/:id/analytics
 * Statistiques d'un QR Code
 */
const getQrCodeAnalytics = async (req, res) => {
  try {
    const qrCode = await QrCode.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!qrCode) {
      return errorResponse(res, 'QR Code introuvable', 404);
    }

    const { getScansByDay, getScansByCountry, getScansByDevice, getScansByBrowser } = require('../services/analyticsService');
    const qrCodeId = qrCode.id;

    const [scansByDay, scansByCountry, scansByDevice, scansByBrowser] = await Promise.all([
      getScansByDay(qrCodeId),
      getScansByCountry(qrCodeId),
      getScansByDevice(qrCodeId),
      getScansByBrowser(qrCodeId),
    ]);

    return successResponse(res, 'Analytiques récupérées', {
      qrCode: { id: qrCode.id, name: qrCode.name, scanCount: qrCode.scanCount },
      scansByDay,
      scansByCountry,
      scansByDevice,
      scansByBrowser,
    });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération des statistiques', 500);
  }
};

/**
 * GET /api/qrcodes/:id/preview
 * Générer un QR Code en base64 pour prévisualisation
 */
const previewQrCode = async (req, res) => {
  try {
    const { content, foregroundColor, backgroundColor, size } = req.query;
    if (!content) {
      return errorResponse(res, 'Contenu requis', 400);
    }

    const base64 = await generateQRBase64(content, {
      foregroundColor: foregroundColor || '#000000',
      backgroundColor: backgroundColor || '#FFFFFF',
      size: Math.min(500, parseInt(size) || 300),
    });

    return successResponse(res, 'Prévisualisation générée', { image: base64 });
  } catch (error) {
    return errorResponse(res, 'Erreur de génération', 500);
  }
};

/**
 * GET /q/:slug
 * Route publique de redirection dynamique (scan du QR Code)
 */
const redirectQrCode = async (req, res) => {
  try {
    const { slug } = req.params;

    const qrCode = await QrCode.findOne({ where: { slug } });

    if (!qrCode) {
      return res.status(404).send(`
        <!DOCTYPE html><html><head><title>QR Code introuvable</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>🔲 QR Code introuvable</h1>
          <p>Ce QR Code n'existe pas ou a été supprimé.</p>
        </body></html>
      `);
    }

    if (!qrCode.isActive) {
      return res.status(410).send(`
        <!DOCTYPE html><html><head><title>QR Code désactivé</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>🔲 QR Code désactivé</h1>
          <p>Ce QR Code a été désactivé par son propriétaire.</p>
        </body></html>
      `);
    }

    if (qrCode.isExpired()) {
      return res.status(410).send(`
        <!DOCTYPE html><html><head><title>QR Code expiré</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h1>⏰ QR Code expiré</h1>
          <p>Ce QR Code a expiré.</p>
        </body></html>
      `);
    }

    // Enregistrer le scan en arrière-plan (sans bloquer la redirection)
    const scanData = extractScanData(req, qrCode.id);
    Promise.all([
      QrScan.create(scanData),
      qrCode.incrementScan(),
    ]).catch(console.error);

    // Rediriger vers le contenu réel
    return res.redirect(302, qrCode.content);
  } catch (error) {
    console.error('redirectQrCode error:', error);
    return res.status(500).send('Erreur interne');
  }
};

/**
 * GET /api/qrcodes/admin
 * Lister tous les QR Codes du système (Admin)
 */
const getAllQrCodes = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const order = getSorting(req.query, ['name', 'scanCount', 'createdAt', 'type'], 'createdAt');
    const search = getSearch(req.query);

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
      ];
    }

    if (req.query.type) where.type = req.query.type;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const { count, rows } = await QrCode.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstname', 'lastname', 'email']
      }]
    });

    return paginatedResponse(res, 'Tous les QR Codes récupérés', rows, { page, limit, total: count });
  } catch (error) {
    console.error('getAllQrCodes error:', error);
    return errorResponse(res, 'Erreur lors de la récupération des QR Codes', 500);
  }
};

/**
 * PATCH /api/qrcodes/admin/:id/toggle
 * Activer/désactiver un QR Code de n'importe quel utilisateur (Admin)
 */
const adminToggleQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findByPk(req.params.id);
    if (!qrCode) return errorResponse(res, 'QR Code introuvable', 404);

    await qrCode.update({ isActive: !qrCode.isActive });
    return successResponse(res, `QR Code ${qrCode.isActive ? 'activé' : 'désactivé'}`, {
      id: qrCode.id,
      isActive: qrCode.isActive,
    });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 500);
  }
};

/**
 * PATCH /api/qrcodes/admin/:id
 * Modifier le nom/statut d'un QR Code de n'importe quel utilisateur (Admin)
 */
const adminUpdateQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findByPk(req.params.id);
    if (!qrCode) return errorResponse(res, 'QR Code introuvable', 404);

    const { name, isActive, expiresAt } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

    await qrCode.update(updateData);
    await qrCode.reload();
    return successResponse(res, 'QR Code mis à jour', qrCode);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 500);
  }
};

/**
 * DELETE /api/qrcodes/admin/:id
 * Supprimer un QR Code de n'importe quel utilisateur (Admin)
 */
const adminDeleteQrCode = async (req, res) => {
  try {
    const qrCode = await QrCode.findByPk(req.params.id);
    if (!qrCode) return errorResponse(res, 'QR Code introuvable', 404);

    if (qrCode.qrImage) deleteQRImage(qrCode.qrImage);
    if (qrCode.logo) deleteQRImage(qrCode.logo);
    await qrCode.destroy();

    return successResponse(res, 'QR Code supprimé avec succès');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la suppression', 500);
  }
};

module.exports = {
  getQrCodes,
  getQrCode,
  createQrCode,
  updateQrCode,
  toggleQrCode,
  deleteQrCode,
  getQrCodeAnalytics,
  previewQrCode,
  redirectQrCode,
  getAllQrCodes,
  adminToggleQrCode,
  adminUpdateQrCode,
  adminDeleteQrCode,
};

