'use strict';

const { Notification } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getPagination } = require('../utils/pagination');

/**
 * @controller NotificationController
 */

const getNotifications = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = { userId: req.user.id };
    if (req.query.isRead !== undefined) where.isRead = req.query.isRead === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });

    return paginatedResponse(res, 'Notifications récupérées', rows, { page, limit, total: count }, { unreadCount });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération des notifications', 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notif) return errorResponse(res, 'Notification introuvable', 404);

    await notif.markAsRead();
    return successResponse(res, 'Notification marquée comme lue', notif);
  } catch (error) {
    return errorResponse(res, 'Erreur', 500);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );
    return successResponse(res, 'Toutes les notifications marquées comme lues');
  } catch (error) {
    return errorResponse(res, 'Erreur', 500);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!notif) return errorResponse(res, 'Notification introuvable', 404);
    await notif.destroy();
    return successResponse(res, 'Notification supprimée');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la suppression', 500);
  }
};

// ADMIN
const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, actionUrl, actionLabel } = req.body;
    const notif = await Notification.create({ userId, title, message, type, actionUrl, actionLabel });
    return successResponse(res, 'Notification créée', notif, 201);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la création', 500);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification };
