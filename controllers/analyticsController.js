'use strict';

const { successResponse, errorResponse } = require('../utils/response');
const { getGlobalStats, getScansByDay, getScansByCountry, getScansByDevice, getScansByBrowser } = require('../services/analyticsService');
const { QrCode, QrScan, User, Subscription } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * @controller AnalyticsController
 */

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Stats utilisateur
    const [totalQrCodes, totalScans, activeQrCodes] = await Promise.all([
      QrCode.count({ where: { userId } }),
      QrScan.count({ include: [{ model: QrCode, as: 'qrCode', where: { userId }, attributes: [] }] }),
      QrCode.count({ where: { userId, isActive: true } }),
    ]);

    const scansByDay = await getScansByDay();
    const scansByCountry = await getScansByCountry();
    const scansByDevice = await getScansByDevice();

    // Top QR Codes
    const topQrCodes = await QrCode.findAll({
      where: { userId },
      order: [['scanCount', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'type', 'scanCount', 'slug', 'isActive'],
    });

    return successResponse(res, 'Statistiques récupérées', {
      overview: { totalQrCodes, totalScans, activeQrCodes },
      scansByDay,
      scansByCountry,
      scansByDevice,
      topQrCodes,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return errorResponse(res, 'Erreur lors de la récupération des statistiques', 500);
  }
};

// Admin Global Stats
const getAdminStats = async (req, res) => {
  try {
    const stats = await getGlobalStats();
    const scansByDay = await getScansByDay();
    const scansByCountry = await getScansByCountry();

    // Nouveaux utilisateurs / 7 jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersWeek = await User.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } });

    // Revenue (demo)
    const revenueData = await Subscription.findAll({
      where: { status: 'active', price: { [Op.gt]: 0 } },
      attributes: [[fn('SUM', col('price')), 'totalRevenue']],
      raw: true,
    });

    return successResponse(res, 'Statistiques admin récupérées', {
      ...stats,
      newUsersWeek,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      scansByDay,
      scansByCountry,
    });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération des statistiques admin', 500);
  }
};

module.exports = { getDashboardStats, getAdminStats };
