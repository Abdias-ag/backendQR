'use strict';

const { QrCode, QrScan, User, Subscription } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { Op } = require('sequelize');

const getActivityLog = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const typeFilter = req.query.type;
    const sinceDate = req.query.since
      ? new Date(req.query.since)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const activities = [];

    if (!typeFilter || typeFilter === 'user_registered') {
      const users = await User.findAll({
        where: { createdAt: { [Op.gte]: sinceDate } },
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 50),
        attributes: ['id', 'firstname', 'lastname', 'email', 'plan', 'createdAt'],
      });
      users.forEach(u => {
        activities.push({
          type: 'user_registered',
          label: 'Nouvelle inscription',
          description: `${u.firstname} ${u.lastname} (${u.email}) a rejoint la plateforme`,
          meta: { userId: u.id, plan: u.plan },
          createdAt: u.createdAt,
        });
      });
    }

    if (!typeFilter || typeFilter === 'qr_created') {
      const qrCodes = await QrCode.findAll({
        where: { createdAt: { [Op.gte]: sinceDate } },
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 50),
        include: [{ model: User, as: 'user', attributes: ['id', 'firstname', 'lastname', 'email'] }],
        attributes: ['id', 'name', 'type', 'slug', 'scanCount', 'isActive', 'createdAt'],
      });
      qrCodes.forEach(qr => {
        const owner = qr.user ? `${qr.user.firstname} ${qr.user.lastname}` : 'Inconnu';
        activities.push({
          type: 'qr_created',
          label: 'QR Code créé',
          description: `${owner} a créé "${qr.name}" (type: ${qr.type})`,
          meta: { qrId: qr.id, slug: qr.slug, type: qr.type, userId: qr.user?.id },
          createdAt: qr.createdAt,
        });
      });
    }

    if (!typeFilter || typeFilter === 'scan') {
      const scans = await QrScan.findAll({
        where: { scannedAt: { [Op.gte]: sinceDate } },
        order: [['scannedAt', 'DESC']],
        limit: Math.min(limit, 50),
        include: [{ model: QrCode, as: 'qrCode', attributes: ['id', 'name', 'slug', 'userId'] }],
        attributes: ['id', 'country', 'city', 'device', 'browser', 'scannedAt'],
      });
      scans.forEach(scan => {
        const qrName = scan.qrCode?.name || 'Inconnu';
        activities.push({
          type: 'scan',
          label: 'QR Code scanné',
          description: `"${qrName}" scanné depuis ${scan.country || 'Pays inconnu'} (${scan.device || 'Inconnu'})`,
          meta: { qrId: scan.qrCode?.id, slug: scan.qrCode?.slug, country: scan.country, device: scan.device, browser: scan.browser },
          createdAt: scan.scannedAt,
        });
      });
    }

    if (!typeFilter || typeFilter === 'plan_changed') {
      const subs = await Subscription.findAll({
        where: { createdAt: { [Op.gte]: sinceDate } },
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 30),
        include: [{ association: 'user', attributes: ['id', 'firstname', 'lastname', 'email'] }],
        attributes: ['id', 'plan', 'price', 'status', 'paymentMethod', 'createdAt'],
      });
      subs.forEach(sub => {
        const owner = sub.user ? `${sub.user.firstname} ${sub.user.lastname}` : 'Inconnu';
        activities.push({
          type: 'plan_changed',
          label: 'Changement de plan',
          description: `${owner} est passé au plan ${sub.plan.toUpperCase()} (${sub.price}EUR/mois)`,
          meta: { userId: sub.user?.id, plan: sub.plan, price: sub.price, paymentMethod: sub.paymentMethod },
          createdAt: sub.createdAt,
        });
      });
    }

    const sorted = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return successResponse(res, "Journal d'activite recupere", sorted);
  } catch (error) {
    console.error('getActivityLog error:', error);
    return errorResponse(res, 'Erreur lors de la recuperation du journal', 500);
  }
};

const getActivityStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [newUsers, newQrs, newScans, newSubs] = await Promise.all([
      User.count({ where: { createdAt: { [Op.gte]: today } } }),
      QrCode.count({ where: { createdAt: { [Op.gte]: today } } }),
      QrScan.count({ where: { scannedAt: { [Op.gte]: today } } }),
      Subscription.count({ where: { createdAt: { [Op.gte]: today }, status: 'active' } }),
    ]);
    return successResponse(res, 'Statistiques du jour', { today: { newUsers, newQrs, newScans, newSubs } });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la recuperation des stats', 500);
  }
};

module.exports = { getActivityLog, getActivityStats };
