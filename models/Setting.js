'use strict';

/**
 * @model Setting
 * @description Paramètres personnalisés par utilisateur
 */
module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define(
    'Setting',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
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
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'fr',
        validate: {
          isIn: {
            args: [['fr', 'en', 'es', 'de', 'ar', 'pt']],
            msg: 'Langue non supportée',
          },
        },
      },
      theme: {
        type: DataTypes.ENUM('light', 'dark', 'system'),
        allowNull: false,
        defaultValue: 'system',
      },
      timezone: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Europe/Paris',
      },
      // Préférences de notifications
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      pushNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      weeklyReport: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Format de date préféré
      dateFormat: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'DD/MM/YYYY',
      },
    },
    {
      tableName: 'settings',
      timestamps: true,
    }
  );

  /**
   * Associations
   */
  Setting.associate = (models) => {
    Setting.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Setting;
};
