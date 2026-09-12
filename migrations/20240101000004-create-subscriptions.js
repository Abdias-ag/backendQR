'use strict';

/**
 * Migration : Création de la table subscriptions
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      plan: {
        type: Sequelize.ENUM('free', 'starter', 'pro', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.ENUM('active', 'cancelled', 'expired', 'trial'),
        allowNull: false,
        defaultValue: 'active',
      },
      paymentMethod: {
        type: Sequelize.ENUM('card', 'paypal', 'stripe', 'bank', 'free'),
        allowNull: true,
        defaultValue: 'free',
      },
      transactionId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        unique: true,
      },
      paymentMetadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      maxQrCodes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      maxScansPerMonth: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('subscriptions', ['userId'], { name: 'subscriptions_user_idx' });
    await queryInterface.addIndex('subscriptions', ['status'], { name: 'subscriptions_status_idx' });
    await queryInterface.addIndex('subscriptions', ['plan'], { name: 'subscriptions_plan_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('subscriptions');
  },
};
