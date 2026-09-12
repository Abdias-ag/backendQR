'use strict';

const { User, QrCode, Setting, Subscription, Notification } = require('../models');
const { Op, fn, col } = require('sequelize');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { getPagination, getSorting, getSearch } = require('../utils/pagination');
const path = require('path');
const fs = require('fs');

/**
 * @controller UserController
 * @description Gestion des profils utilisateurs (CRUD + admin)
 */

/**
 * GET /api/users/profile
 * Obtenir le profil complet de l'utilisateur connecté
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { association: 'settings' },
        { association: 'subscriptions', limit: 1, order: [['createdAt', 'DESC']] },
      ],
    });
    return successResponse(res, 'Profil récupéré', user);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération du profil', 500);
  }
};

/**
 * PUT /api/users/profile
 * Mettre à jour le profil de l'utilisateur connecté
 */
const updateProfile = async (req, res) => {
  try {
    const { firstname, lastname, phone } = req.body;
    const user = await User.findByPk(req.user.id);

    const updateData = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;
    if (phone !== undefined) updateData.phone = phone;

    // Avatar uploadé
    if (req.file) {
      // Supprimer l'ancien avatar
      if (user.avatar) {
        const oldPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.update(updateData);
    await user.reload();

    return successResponse(res, 'Profil mis à jour', {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      plan: user.plan,
      role: user.role,
    });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la mise à jour du profil', 500);
  }
};

/**
 * PUT /api/users/password
 * Changer le mot de passe de l'utilisateur connecté
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.scope('withPassword').findByPk(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return errorResponse(res, 'Mot de passe actuel incorrect', 400);
    }

    await user.update({ password: newPassword });

    return successResponse(res, 'Mot de passe modifié avec succès');
  } catch (error) {
    return errorResponse(res, 'Erreur lors du changement de mot de passe', 500);
  }
};

/**
 * DELETE /api/users/profile
 * Supprimer son propre compte
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.scope('withPassword').findByPk(req.user.id);
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return errorResponse(res, 'Mot de passe incorrect', 400);
    }

    await user.destroy();
    return successResponse(res, 'Compte supprimé avec succès');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la suppression du compte', 500);
  }
};

/* ============================================================
   ADMIN ROUTES
   ============================================================ */

/**
 * GET /api/admin/users
 * Lister tous les utilisateurs (admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const order = getSorting(req.query, ['firstname', 'email', 'createdAt', 'plan', 'status'], 'createdAt');
    const search = getSearch(req.query);

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstname: { [Op.like]: `%${search}%` } },
        { lastname: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (req.query.plan) where.plan = req.query.plan;
    if (req.query.status) where.status = req.query.status;
    if (req.query.role) where.role = req.query.role;

    const { count, rows } = await User.findAndCountAll({
      where,
      order,
      limit,
      offset,
      attributes: { exclude: ['password', 'verificationCode', 'resetPasswordCode', 'refreshToken'] },
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const countByPeriod = async (start) => QrCode.findAll({
      where: { createdAt: { [Op.gte]: start } },
      attributes: ['userId', [fn('COUNT', col('id')), 'count']],
      group: ['userId'],
      raw: true,
    });

    const [todayCounts, monthCounts, yearCounts] = await Promise.all([
      countByPeriod(startOfDay),
      countByPeriod(startOfMonth),
      countByPeriod(startOfYear),
    ]);
    const toMap = (items) => new Map(items.map((item) => [String(item.userId), Number(item.count)]));
    const todayMap = toMap(todayCounts);
    const monthMap = toMap(monthCounts);
    const yearMap = toMap(yearCounts);
    const enrichedRows = rows.map((user) => {
      const data = user.toJSON();
      const key = String(user.id);
      return {
        ...data,
        qrCreated: {
          today: todayMap.get(key) || 0,
          month: monthMap.get(key) || 0,
          year: yearMap.get(key) || 0,
        },
      };
    });

    return paginatedResponse(res, 'Utilisateurs récupérés', enrichedRows, { page, limit, total: count });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération des utilisateurs', 500);
  }
};

/**
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'verificationCode', 'resetPasswordCode', 'refreshToken'] },
      include: [
        { association: 'settings' },
        { association: 'subscriptions', order: [['createdAt', 'DESC']], limit: 5 },
        { association: 'qrCodes', limit: 10, order: [['createdAt', 'DESC']] },
      ],
    });

    if (!user) return errorResponse(res, 'Utilisateur introuvable', 404);
    return successResponse(res, 'Utilisateur récupéré', user);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération', 500);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return errorResponse(res, 'Utilisateur introuvable', 404);

    await user.update({ status });
    return successResponse(res, `Statut mis à jour : ${status}`, { id: user.id, status });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 500);
  }
};

/**
 * PATCH /api/users/admin/users/:id/verify-email
 * Confirmer manuellement l'adresse email d'un utilisateur (admin)
 */
const verifyUserEmail = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return errorResponse(res, 'Utilisateur introuvable', 404);

    await user.update({
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    });

    return successResponse(res, 'Adresse email confirmée par l\'administrateur', {
      id: user.id,
      isVerified: user.isVerified,
    });
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la confirmation de l\'email', 500);
  }
};

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return errorResponse(res, 'Utilisateur introuvable', 404);
    if (user.role === 'admin') return errorResponse(res, 'Impossible de supprimer un administrateur', 403);

    await user.destroy();
    return successResponse(res, 'Utilisateur supprimé');
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la suppression', 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUserStatus,
  verifyUserEmail,
  deleteUser,
};
