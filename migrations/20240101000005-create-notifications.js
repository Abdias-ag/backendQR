'use strict';

/**
 * Migration : Création de la table notifications
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('info', 'success', 'warning', 'error', 'promo'),
        allowNull: false,
        defaultValue: 'info',
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      actionUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      actionLabel: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      readAt: {
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

    await queryInterface.addIndex('notifications', ['userId'], { name: 'notifications_user_idx' });
    await queryInterface.addIndex('notifications', ['isRead'], { name: 'notifications_read_idx' });
    await queryInterface.addIndex('notifications', ['type'], { name: 'notifications_type_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
