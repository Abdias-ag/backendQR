'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();
const { getMysqlSslOptions } = require('./mysqlSsl');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'qr_platform',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || null,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      ...(getMysqlSslOptions() ? { ssl: getMysqlSslOptions() } : {}),
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

/**
 * Test the database connection
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
