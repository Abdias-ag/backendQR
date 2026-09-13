'use strict';

/**
 * @util response
 * @description Formatage uniforme des réponses API
 */

/**
 * Réponse de succès
 */
const successResponse = (res, message, data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return res.status(statusCode).json(response);
};

/**
 * Réponse d'erreur
 */
const errorResponse = (res, message, statusCode = 500, code = null, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (code) response.code = code;
  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};

/**
 * Réponse paginée
 */
const paginatedResponse = (res, message, data, pagination, meta = null) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1,
    },
  };

  if (meta !== null) response.meta = meta;
  return res.status(200).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
