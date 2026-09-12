'use strict';

/**
 * Migration : Création de la table settings
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      language: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'fr',
      },
      theme: {
        type: Sequelize.ENUM('light', 'dark', 'system'),
        allowNull: false,
        defaultValue: 'system',
      },
      timezone: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Europe/Paris',
      },
      emailNotifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      pushNotifications: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      weeklyReport: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dateFormat: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'DD/MM/YYYY',
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

    await queryInterface.addIndex('settings', ['userId'], { unique: true, name: 'settings_user_unique' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('settings');
  },
};
