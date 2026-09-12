'use strict';

const UAParser = require('ua-parser-js');
let geoip;
try {
  geoip = require('geoip-lite');
} catch {
  geoip = null;
}

/**
 * @helper scanHelper
 * @description Extraire les informations de scan depuis la requête HTTP
 */

/**
 * Extraire les données de l'appareil depuis le User-Agent
 * @param {string} userAgent - User-Agent string
 * @returns {Object} - device, browser, os
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return { device: 'unknown', browser: null, os: null };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  let deviceType = 'desktop';
  if (result.device.type === 'mobile') deviceType = 'mobile';
  else if (result.device.type === 'tablet') deviceType = 'tablet';

  const browser = result.browser.name || null;
  const os = result.os.name || null;

  return { device: deviceType, browser, os };
};

/**
 * Extraire l'adresse IP réelle (proxy, load balancer)
 * @param {Object} req - Objet requête Express
 * @returns {string|null}
 */
const getRealIP = (req) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null;

  // Supprimer le préfixe IPv6 ::ffff:
  return ip ? ip.replace('::ffff:', '') : null;
};

/**
 * Obtenir les données géographiques depuis l'IP
 * @param {string} ip - Adresse IP
 * @returns {Object} - country, countryCode, city
 */
const getGeoData = (ip) => {
  if (!ip || !geoip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { country: null, countryCode: null, city: null };
  }

  try {
    const geo = geoip.lookup(ip);
    if (!geo) return { country: null, countryCode: null, city: null };

    return {
      country: geo.country ? getCountryName(geo.country) : null,
      countryCode: geo.country || null,
      city: geo.city || null,
    };
  } catch {
    return { country: null, countryCode: null, city: null };
  }
};

/**
 * Convertir code pays ISO en nom
 */
const countryNames = {
  FR: 'France', DE: 'Allemagne', BE: 'Belgique', CH: 'Suisse',
  CA: 'Canada', MA: 'Maroc', US: 'États-Unis', GB: 'Royaume-Uni',
  ES: 'Espagne', IT: 'Italie', PT: 'Portugal', NL: 'Pays-Bas',
  TN: 'Tunisie', DZ: 'Algérie', SN: 'Sénégal', CI: 'Côte d\'Ivoire',
};

const getCountryName = (code) => countryNames[code] || code;

/**
 * Extraire toutes les données d'un scan depuis la requête
 * @param {Object} req - Objet requête Express
 * @param {number} qrCodeId - ID du QR Code scanné
 * @returns {Object} - Données complètes du scan
 */
const extractScanData = (req, qrCodeId) => {
  const ip = getRealIP(req);
  const userAgent = req.headers['user-agent'] || null;
  const { device, browser, os } = parseUserAgent(userAgent);
  const { country, countryCode, city } = getGeoData(ip);

  return {
    qrCodeId,
    ip,
    country,
    countryCode,
    city,
    device,
    browser,
    os,
    userAgent,
    latitude: null,
    longitude: null,
    referer: req.headers.referer || null,
    scannedAt: new Date(),
  };
};

module.exports = {
  parseUserAgent,
  getRealIP,
  getGeoData,
  extractScanData,
};
