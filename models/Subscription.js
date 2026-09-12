'use strict';

/**
 * @model Subscription
 * @description Gestion des abonnements utilisateurs (plans SaaS)
 */
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    'Subscription',
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
      plan: {
        type: DataTypes.ENUM('free', 'starter', 'pro', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: { args: [0], msg: 'Le prix ne peut pas être négatif' },
        },
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM('active', 'cancelled', 'expired', 'trial'),
        allowNull: false,
        defaultValue: 'active',
      },
      paymentMethod: {
        type: DataTypes.ENUM('card', 'paypal', 'stripe', 'bank', 'free'),
        allowNull: true,
        defaultValue: 'free',
      },
      transactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        unique: true,
      },
      // Métadonnées paiement
      paymentMetadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      // Limites du plan
      maxQrCodes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      maxScansPerMonth: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null, // null = illimité
      },
    },
    {
      tableName: 'subscriptions',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['plan'] },
      ],
    }
  );

  /**
   * Méthode d'instance : vérifier si l'abonnement est actif
   */
  Subscription.prototype.isActive = function () {
    if (this.status !== 'active' && this.status !== 'trial') return false;
    if (this.endDate && new Date() > new Date(this.endDate)) return false;
    return true;
  };

  /**
   * Associations
   */
  Subscription.associate = (models) => {
    // Un abonnement appartient à un utilisateur
    Subscription.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Subscription;
};
