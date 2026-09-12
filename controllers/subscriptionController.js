'use strict';

const { Subscription, User } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

/**
 * @controller SubscriptionController
 */

const PLAN_CONFIG = {
  free:       { maxQrCodes: 5,   maxScansPerMonth: 500,   price: 0 },
  starter:    { maxQrCodes: 20,  maxScansPerMonth: 2000,  price: 9.99 },
  pro:        { maxQrCodes: 50,  maxScansPerMonth: 10000, price: 19.99 },
  enterprise: { maxQrCodes: -1,  maxScansPerMonth: null,  price: 49.99 },
};

const getMySubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      where: { userId: req.user.id, status: { [Op.in]: ['active', 'trial'] } },
      order: [['createdAt', 'DESC']],
    });
    return successResponse(res, 'Abonnement récupéré', sub);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération', 500);
  }
};

const getSubscriptionHistory = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { count, rows } = await Subscription.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return paginatedResponse(res, 'Historique récupéré', rows, { page, limit, total: count });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération', 500);
  }
};

const upgradePlan = async (req, res) => {
  try {
    const { plan, paymentMethod, transactionId } = req.body;

    if (!PLAN_CONFIG[plan]) {
      return errorResponse(res, 'Plan invalide', 400);
    }

    const config = PLAN_CONFIG[plan];

    // Annuler l'abonnement actuel
    await Subscription.update(
      { status: 'cancelled' },
      { where: { userId: req.user.id, status: { [Op.in]: ['active', 'trial'] } } }
    );

    // Créer le nouvel abonnement
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await Subscription.create({
      userId: req.user.id,
      plan,
      price: config.price,
      currency: 'EUR',
      startDate: new Date(),
      endDate: plan === 'free' ? null : endDate,
      status: 'active',
      paymentMethod: paymentMethod || (plan === 'free' ? 'free' : 'stripe'),
      transactionId: transactionId || null,
      maxQrCodes: config.maxQrCodes,
      maxScansPerMonth: config.maxScansPerMonth,
    });

    // Mettre à jour le plan de l'utilisateur
    await User.update({ plan }, { where: { id: req.user.id } });

    return successResponse(res, `Plan ${plan} activé avec succès`, subscription, 201);
  } catch (error) {
    return errorResponse(res, 'Erreur lors du changement de plan', 500);
  }
};

const getPlanInfo = async (req, res) => {
  return successResponse(res, 'Plans disponibles', PLAN_CONFIG);
};

// ADMIN
const getAllSubscriptions = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = {};
    if (req.query.plan) where.plan = req.query.plan;
    if (req.query.status) where.status = req.query.status;

    const userInclude = {
      association: 'user',
      attributes: ['id', 'firstname', 'lastname', 'email']
    };

    if (req.query.search) {
      userInclude.where = {
        [Op.or]: [
          { firstname: { [Op.like]: `%${req.query.search}%` } },
          { lastname: { [Op.like]: `%${req.query.search}%` } },
          { email: { [Op.like]: `%${req.query.search}%` } }
        ]
      };
    }

    const { count, rows } = await Subscription.findAndCountAll({
      where,
      include: [userInclude],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return paginatedResponse(res, 'Abonnements récupérés', rows, { page, limit, total: count });
  } catch (error) {
    console.error('getAllSubscriptions error:', error);
    return errorResponse(res, 'Erreur lors de la récupération', 500);
  }
};

// ADMIN — Changer le plan d'un utilisateur précis
const adminChangePlan = async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!PLAN_CONFIG[plan]) {
      return errorResponse(res, 'Plan invalide', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) return errorResponse(res, 'Utilisateur introuvable', 404);

    const config = PLAN_CONFIG[plan];

    // Annuler les abonnements actifs de cet utilisateur
    await Subscription.update(
      { status: 'cancelled' },
      { where: { userId, status: { [Op.in]: ['active', 'trial'] } } }
    );

    // Créer le nouvel abonnement
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await Subscription.create({
      userId,
      plan,
      price: config.price,
      currency: 'EUR',
      startDate: new Date(),
      endDate: plan === 'free' ? null : endDate,
      status: 'active',
      paymentMethod: plan === 'free' ? 'free' : 'admin',
      transactionId: `ADMIN-${Date.now()}`,
      maxQrCodes: config.maxQrCodes,
      maxScansPerMonth: config.maxScansPerMonth,
    });

    // Mettre à jour le plan de l'utilisateur
    await User.update({ plan }, { where: { id: userId } });

    return successResponse(res, `Plan ${plan} assigné à l'utilisateur`, subscription, 201);
  } catch (error) {
    console.error('adminChangePlan error:', error);
    return errorResponse(res, 'Erreur lors du changement de plan', 500);
  }
};

module.exports = { getMySubscription, getSubscriptionHistory, upgradePlan, getPlanInfo, getAllSubscriptions, adminChangePlan };
