'use strict';

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

/**
 * @service QRService
 * @description Service de génération de QR Codes avec personnalisation
 */

/**
 * Générer une image QR Code et la sauvegarder
 * @param {string} content - Contenu à encoder
 * @param {Object} options - Options de personnalisation
 * @returns {Promise<string>} - Chemin de l'image sauvegardée
 */
const generateQRImage = async (content, options = {}) => {
  const {
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    size = 300,
    errorCorrectionLevel = 'M',
  } = options;

  // S'assurer que le dossier uploads existe
  const uploadDir = path.join(__dirname, '../uploads/qrcodes');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
  const filepath = path.join(uploadDir, filename);

  const qrOptions = {
    errorCorrectionLevel,
    width: size,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    margin: 2,
  };

  await QRCode.toFile(filepath, content, qrOptions);

  return `/uploads/qrcodes/${filename}`;
};

/**
 * Générer un QR Code en base64 (pour l'API)
 * @param {string} content - Contenu à encoder
 * @param {Object} options - Options de personnalisation
 * @returns {Promise<string>} - Image en base64
 */
const generateQRBase64 = async (content, options = {}) => {
  const {
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    size = 300,
    errorCorrectionLevel = 'M',
  } = options;

  const qrOptions = {
    errorCorrectionLevel,
    width: size,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    margin: 2,
  };

  const dataUrl = await QRCode.toDataURL(content, qrOptions);
  return dataUrl;
};

/**
 * Générer le contenu encodé dans le QR Code selon le type
 * @param {string} type - Type de QR Code
 * @param {Object} data - Données du QR Code
 * @returns {string} - Contenu à encoder
 */
const buildQRContent = (type, data) => {
  switch (type) {
    case 'url':
      return data.url || data.content;

    case 'text':
      return data.text || data.content;

    case 'phone':
      return `tel:${data.phone}`;

    case 'sms':
      return `sms:${data.phone}${data.message ? `?body=${encodeURIComponent(data.message)}` : ''}`;

    case 'email':
      let emailStr = `mailto:${data.email}`;
      const emailParams = [];
      if (data.subject) emailParams.push(`subject=${encodeURIComponent(data.subject)}`);
      if (data.body) emailParams.push(`body=${encodeURIComponent(data.body)}`);
      if (emailParams.length) emailStr += `?${emailParams.join('&')}`;
      return emailStr;

    case 'whatsapp':
      return `https://wa.me/${data.phone.replace(/[^0-9]/g, '')}${data.message ? `?text=${encodeURIComponent(data.message)}` : ''}`;

    case 'wifi':
      return `WIFI:T:${data.security || 'WPA'};S:${data.ssid};P:${data.password};;`;

    case 'vcard':
      return buildVCard(data);

    case 'location':
      return `https://maps.google.com/?q=${data.latitude},${data.longitude}`;

    case 'pdf':
    case 'image':
    case 'video':
    case 'download':
      return data.url || data.content;

    default:
      return data.content || '';
  }
};

/**
 * Construire une vCard standard
 */
const buildVCard = (data) => {
  let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
  if (data.name || (data.firstname && data.lastname)) {
    const fullName = data.name || `${data.firstname} ${data.lastname}`;
    vcard += `FN:${fullName}\n`;
  }
  if (data.firstname || data.lastname) {
    vcard += `N:${data.lastname || ''};${data.firstname || ''};;;\n`;
  }
  if (data.phone) vcard += `TEL:${data.phone}\n`;
  if (data.email) vcard += `EMAIL:${data.email}\n`;
  if (data.organization) vcard += `ORG:${data.organization}\n`;
  if (data.title) vcard += `TITLE:${data.title}\n`;
  if (data.website) vcard += `URL:${data.website}\n`;
  if (data.address) vcard += `ADR:;;${data.address};;;;\n`;
  vcard += 'END:VCARD';
  return vcard;
};

/**
 * Générer un slug unique aléatoire
 * @param {number} length - Longueur du slug
 * @returns {string}
 */
const generateSlug = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
};

/**
 * Supprimer l'image QR Code du disque
 * @param {string} imagePath - Chemin relatif de l'image
 */
const deleteQRImage = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, '..', imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

module.exports = {
  generateQRImage,
  generateQRBase64,
  buildQRContent,
  buildVCard,
  generateSlug,
  deleteQRImage,
};
