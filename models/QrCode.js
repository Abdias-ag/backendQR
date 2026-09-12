'use strict';

/**
 * @model QrCode
 * @description Modèle QR Code dynamique avec tracking et personnalisation
 */
module.exports = (sequelize, DataTypes) => {
  const QrCode = sequelize.define(
    'QrCode',
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le nom du QR Code est requis' },
          len: { args: [1, 255], msg: 'Le nom doit contenir entre 1 et 255 caractères' },
        },
      },
      type: {
        type: DataTypes.ENUM(
          'url',
          'text',
          'phone',
          'sms',
          'email',
          'whatsapp',
          'wifi',
          'vcard',
          'location',
          'pdf',
          'image',
          'video',
          'download'
        ),
        allowNull: false,
        defaultValue: 'url',
      },
      // Contenu cible réel (URL, texte, données vCard, etc.)
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le contenu du QR Code est requis' },
        },
      },
      // URL dynamique encodée dans le QR Code
      dynamicUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      // Slug unique pour la redirection
      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: 'Ce slug est déjà utilisé' },
        validate: {
          notEmpty: { msg: 'Le slug est requis' },
        },
      },
      // Personnalisation visuelle
      foregroundColor: {
        type: DataTypes.STRING(7),
        allowNull: false,
        defaultValue: '#000000',
        validate: {
          is: {
            args: /^#[0-9A-Fa-f]{6}$/,
            msg: 'Couleur de premier plan invalide (format: #RRGGBB)',
          },
        },
      },
      backgroundColor: {
        type: DataTypes.STRING(7),
        allowNull: false,
        defaultValue: '#FFFFFF',
        validate: {
          is: {
            args: /^#[0-9A-Fa-f]{6}$/,
            msg: 'Couleur de fond invalide (format: #RRGGBB)',
          },
        },
      },
      // Logo au centre du QR Code
      logo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      // Image QR Code générée
      qrImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 300,
        validate: {
          min: { args: [100], msg: 'La taille minimale est 100px' },
          max: { args: [1000], msg: 'La taille maximale est 1000px' },
        },
      },
      // Données supplémentaires (WiFi SSID, vCard fields, etc.)
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      // Compteur de scans
      scanCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Date d'expiration (null = jamais)
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: 'qr_codes',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['userId'] },
        { fields: ['type'] },
        { fields: ['isActive'] },
      ],
    }
  );

  /**
   * Méthode d'instance : vérifier si le QR Code est expiré
   */
  QrCode.prototype.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  };

  /**
   * Méthode d'instance : incrémenter le compteur de scans
   */
  QrCode.prototype.incrementScan = async function () {
    this.scanCount += 1;
    await this.save({ fields: ['scanCount'] });
    return this.scanCount;
  };

  /**
   * Associations
   */
  QrCode.associate = (models) => {
    // Un QR Code appartient à un utilisateur
    QrCode.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    // Un QR Code possède plusieurs scans
    QrCode.hasMany(models.QrScan, {
      foreignKey: 'qrCodeId',
      as: 'scans',
      onDelete: 'CASCADE',
    });
  };

  return QrCode;
};
