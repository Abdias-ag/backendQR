'use strict';

const bcrypt = require('bcryptjs');

/**
 * @model User
 * @description Modèle utilisateur principal avec authentification JWT
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstname: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le prénom est requis' },
          len: { args: [2, 100], msg: 'Le prénom doit contenir entre 2 et 100 caractères' },
        },
      },
      lastname: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le nom est requis' },
          len: { args: [2, 100], msg: 'Le nom doit contenir entre 2 et 100 caractères' },
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: { msg: 'Cet email est déjà utilisé' },
        validate: {
          isEmail: { msg: 'Email invalide' },
          notEmpty: { msg: 'L\'email est requis' },
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: {
            args: /^[+\d\s\-()]{7,20}$/,
            msg: 'Numéro de téléphone invalide',
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le mot de passe est requis' },
          len: { args: [6, 255], msg: 'Le mot de passe doit contenir au moins 6 caractères' },
        },
      },
      avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      plan: {
        type: DataTypes.ENUM('free', 'starter', 'pro', 'enterprise'),
        allowNull: false,
        defaultValue: 'free',
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verificationCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: null,
      },
      verificationCodeExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      resetPasswordCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: null,
      },
      resetPasswordCodeExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'banned'),
        allowNull: false,
        defaultValue: 'active',
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      // Exclure les champs sensibles par défaut
      defaultScope: {
        attributes: {
          exclude: ['password', 'verificationCode', 'resetPasswordCode', 'refreshToken'],
        },
      },
      scopes: {
        withPassword: {
          attributes: {
            include: ['password'],
          },
        },
        withTokens: {
          attributes: {
            include: ['password', 'refreshToken', 'verificationCode', 'resetPasswordCode'],
          },
        },
      },
      hooks: {
        // Hacher le mot de passe avant création
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        // Hacher le mot de passe avant mise à jour
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  /**
   * Méthode d'instance : vérifier le mot de passe
   */
  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  /**
   * Méthode d'instance : obtenir le nom complet
   */
  User.prototype.getFullName = function () {
    return `${this.firstname} ${this.lastname}`;
  };

  /**
   * Associations
   */
  User.associate = (models) => {
    // Un utilisateur possède plusieurs QR Codes
    User.hasMany(models.QrCode, {
      foreignKey: 'userId',
      as: 'qrCodes',
      onDelete: 'CASCADE',
    });

    // Un utilisateur possède plusieurs abonnements
    User.hasMany(models.Subscription, {
      foreignKey: 'userId',
      as: 'subscriptions',
      onDelete: 'CASCADE',
    });

    // Un utilisateur possède plusieurs notifications
    User.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications',
      onDelete: 'CASCADE',
    });

    // Un utilisateur possède un paramètre
    User.hasOne(models.Setting, {
      foreignKey: 'userId',
      as: 'settings',
      onDelete: 'CASCADE',
    });
  };

  return User;
};
