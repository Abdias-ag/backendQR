'use strict';

/**
 * @model QrScan
 * @description Enregistrement des scans de QR Codes avec données analytiques
 */
module.exports = (sequelize, DataTypes) => {
  const QrScan = sequelize.define(
    'QrScan',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      qrCodeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'qr_codes',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Adresse IP du visiteur
      ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
        defaultValue: null,
      },
      // Données géographiques
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      countryCode: {
        type: DataTypes.STRING(5),
        allowNull: true,
        defaultValue: null,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      // Données de l'appareil
      device: {
        type: DataTypes.ENUM('mobile', 'tablet', 'desktop', 'unknown'),
        allowNull: true,
        defaultValue: 'unknown',
      },
      browser: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      os: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      // Coordonnées GPS (optionnelles)
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        defaultValue: null,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        defaultValue: null,
      },
      // Référent
      referer: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      scannedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'qr_scans',
      timestamps: false,
      indexes: [
        { fields: ['qrCodeId'] },
        { fields: ['scannedAt'] },
        { fields: ['country'] },
        { fields: ['device'] },
      ],
    }
  );

  /**
   * Associations
   */
  QrScan.associate = (models) => {
    // Un scan appartient à un QR Code
    QrScan.belongsTo(models.QrCode, {
      foreignKey: 'qrCodeId',
      as: 'qrCode',
    });
  };

  return QrScan;
};
