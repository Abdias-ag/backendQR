'use strict';

/**
 * @model Notification
 * @description Notifications in-app pour les utilisateurs
 */
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
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
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le titre est requis' },
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le message est requis' },
        },
      },
      type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'promo'),
        allowNull: false,
        defaultValue: 'info',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Lien d'action optionnel
      actionUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      actionLabel: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['isRead'] },
        { fields: ['type'] },
      ],
    }
  );

  /**
   * Méthode d'instance : marquer comme lu
   */
  Notification.prototype.markAsRead = async function () {
    this.isRead = true;
    this.readAt = new Date();
    await this.save({ fields: ['isRead', 'readAt'] });
    return this;
  };

  /**
   * Associations
   */
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Notification;
};
