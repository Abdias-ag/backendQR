'use strict';

/**
 * Migration : Création de la table qr_scans
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('qr_scans', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      qrCodeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'qr_codes',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
        defaultValue: null,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      countryCode: {
        type: Sequelize.STRING(5),
        allowNull: true,
        defaultValue: null,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      device: {
        type: Sequelize.ENUM('mobile', 'tablet', 'desktop', 'unknown'),
        allowNull: true,
        defaultValue: 'unknown',
      },
      browser: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      os: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        defaultValue: null,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        defaultValue: null,
      },
      referer: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      scannedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('qr_scans', ['qrCodeId'], { name: 'qr_scans_qrcode_idx' });
    await queryInterface.addIndex('qr_scans', ['scannedAt'], { name: 'qr_scans_date_idx' });
    await queryInterface.addIndex('qr_scans', ['country'], { name: 'qr_scans_country_idx' });
    await queryInterface.addIndex('qr_scans', ['device'], { name: 'qr_scans_device_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('qr_scans');
  },
};
