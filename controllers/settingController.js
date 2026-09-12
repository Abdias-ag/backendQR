'use strict';

const { Setting } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @controller SettingController
 */

const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ where: { userId: req.user.id } });
    if (!settings) {
      settings = await Setting.create({ userId: req.user.id });
    }
    return successResponse(res, 'Paramètres récupérés', settings);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la récupération des paramètres', 500);
  }
};

const updateSettings = async (req, res) => {
  try {
    const { language, theme, timezone, emailNotifications, pushNotifications, weeklyReport, dateFormat } = req.body;

    let settings = await Setting.findOne({ where: { userId: req.user.id } });
    if (!settings) {
      settings = await Setting.create({ userId: req.user.id });
    }

    const updateData = {};
    if (language !== undefined) updateData.language = language;
    if (theme !== undefined) updateData.theme = theme;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (weeklyReport !== undefined) updateData.weeklyReport = weeklyReport;
    if (dateFormat !== undefined) updateData.dateFormat = dateFormat;

    await settings.update(updateData);
    return successResponse(res, 'Paramètres mis à jour', settings);
  } catch (error) {
    return errorResponse(res, 'Erreur lors de la mise à jour', 500);
  }
};

module.exports = { getSettings, updateSettings };
