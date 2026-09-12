'use strict';

const { QrScan, QrCode } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * @service AnalyticsService
 * @description Service d'analyse des statistiques de scans
 */

/**
 * Obtenir les statistiques globales pour le dashboard admin
 */
const getGlobalStats = async () => {
  const { User, QrCode: QrCodeModel, QrScan: QrScanModel, Subscription } = require('../models');

  const [totalUsers, activeUsers, inactiveUsers, totalQrCodes, totalScans, activeSubscriptions] = await Promise.all([
    User.count(),
    User.count({ where: { status: 'active' } }),
    User.count({ where: { status: { [Op.ne]: 'active' } } }),
    QrCodeModel.count(),
    QrScanModel.count(),
    Subscription.count({ where: { status: 'active' } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalQrCodes,
    totalScans,
    activeSubscriptions,
  };
};

/**
 * Obtenir les scans par jour (30 derniers jours)
 * @param {number} qrCodeId - ID du QR Code (optionnel)
 */
const getScansByDay = async (qrCodeId = null) => {
  const where = {};
  if (qrCodeId) where.qrCodeId = qrCodeId;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  where.scannedAt = { [Op.gte]: thirtyDaysAgo };

  const scans = await QrScan.findAll({
    where,
    attributes: [
      [fn('DATE', col('scannedAt')), 'date'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('scannedAt'))],
    order: [[fn('DATE', col('scannedAt')), 'ASC']],
    raw: true,
  });

  return scans;
};

/**
 * Obtenir la répartition par pays
 * @param {number} qrCodeId - ID du QR Code (optionnel)
 */
const getScansByCountry = async (qrCodeId = null) => {
  const where = { country: { [Op.not]: null } };
  if (qrCodeId) where.qrCodeId = qrCodeId;

  const scans = await QrScan.findAll({
    where,
    attributes: [
      'country',
      'countryCode',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['country', 'countryCode'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: 10,
    raw: true,
  });

  return scans;
};

/**
 * Obtenir la répartition par appareil
 * @param {number} qrCodeId - ID du QR Code (optionnel)
 */
const getScansByDevice = async (qrCodeId = null) => {
  const where = {};
  if (qrCodeId) where.qrCodeId = qrCodeId;

  const scans = await QrScan.findAll({
    where,
    attributes: [
      'device',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['device'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    raw: true,
  });

  return scans;
};

/**
 * Obtenir la répartition par navigateur
 * @param {number} qrCodeId - ID du QR Code (optionnel)
 */
const getScansByBrowser = async (qrCodeId = null) => {
  const where = { browser: { [Op.not]: null } };
  if (qrCodeId) where.qrCodeId = qrCodeId;

  const scans = await QrScan.findAll({
    where,
    attributes: [
      'browser',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['browser'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: 10,
    raw: true,
  });

  return scans;
};

/**
 * Enregistrer un scan de QR Code
 * @param {Object} scanData - Données du scan
 */
const recordScan = async (scanData) => {
  const scan = await QrScan.create(scanData);
  return scan;
};

module.exports = {
  getGlobalStats,
  getScansByDay,
  getScansByCountry,
  getScansByDevice,
  getScansByBrowser,
  recordScan,
};
