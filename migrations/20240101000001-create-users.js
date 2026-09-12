'use strict';

/**
 * Migration : Création de la table users
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstname: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      lastname: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: null,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      avatar: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      plan: {
        type: Sequelize.ENUM('free', 'starter', 'pro', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verificationCode: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: null,
      },
      verificationCodeExpires: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      resetPasswordCode: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: null,
      },
      resetPasswordCodeExpires: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'banned'),
        allowNull: false,
        defaultValue: 'active',
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Index sur l'email
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_unique' });
    await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });
    await queryInterface.addIndex('users', ['plan'], { name: 'users_plan_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
