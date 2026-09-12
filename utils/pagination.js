'use strict';

/**
 * @util pagination
 * @description Utilitaire de pagination pour Sequelize
 */

/**
 * Extraire les paramètres de pagination depuis la requête
 * @param {Object} query - Query params de la requête
 * @returns {Object} - page, limit, offset
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Extraire les paramètres de tri depuis la requête
 * @param {Object} query - Query params de la requête
 * @param {string[]} allowedFields - Champs autorisés pour le tri
 * @param {string} defaultField - Champ par défaut
 * @returns {Array} - Tableau [field, direction] pour Sequelize
 */
const getSorting = (query, allowedFields = [], defaultField = 'createdAt') => {
  const sortField = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const sortDir = query.sortDir === 'asc' ? 'ASC' : 'DESC';
  return [[sortField, sortDir]];
};

/**
 * Extraire les paramètres de recherche depuis la requête
 * @param {Object} query - Query params de la requête
 * @returns {string|null} - Terme de recherche nettoyé
 */
const getSearch = (query) => {
  const search = query.search || query.q || '';
  return search.trim() || null;
};

module.exports = {
  getPagination,
  getSorting,
  getSearch,
};
