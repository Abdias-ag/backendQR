'use strict';

/**
 * Migration : Création de la table qr_codes
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('qr_codes', {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          'url', 'text', 'phone', 'sms', 'email',
          'whatsapp', 'wifi', 'vcard', 'location',
          'pdf', 'image', 'video', 'download'
        ),
        allowNull: false,
        defaultValue: 'url',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      dynamicUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      foregroundColor: {
        type: Sequelize.STRING(7),
        allowNull: false,
        defaultValue: '#000000',
      },
      backgroundColor: {
        type: Sequelize.STRING(7),
        allowNull: false,
        defaultValue: '#FFFFFF',
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      qrImage: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 300,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      scanCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expiresAt: {
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

    await queryInterface.addIndex('qr_codes', ['slug'], { unique: true, name: 'qr_codes_slug_unique' });
    await queryInterface.addIndex('qr_codes', ['userId'], { name: 'qr_codes_user_idx' });
    await queryInterface.addIndex('qr_codes', ['type'], { name: 'qr_codes_type_idx' });
    await queryInterface.addIndex('qr_codes', ['isActive'], { name: 'qr_codes_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('qr_codes');
  },
};
