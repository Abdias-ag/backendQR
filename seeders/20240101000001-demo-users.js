'use strict';

const bcrypt = require('bcryptjs');

/**
 * Seeder : Création des utilisateurs de démonstration
 */
module.exports = {
  async up(queryInterface) {
    const salt = await bcrypt.genSalt(12);
    const adminPassword = await bcrypt.hash('Admin@123456', salt);
    const userPassword = await bcrypt.hash('User@123456', salt);

    await queryInterface.bulkInsert('users', [
      {
        firstname: 'Admin',
        lastname: 'System',
        email: 'admin@qr-platform.com',
        phone: '+33600000001',
        password: adminPassword,
        avatar: null,
        plan: 'enterprise',
        role: 'admin',
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
        resetPasswordCode: null,
        resetPasswordCodeExpires: null,
        refreshToken: null,
        status: 'active',
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean.dupont@example.com',
        phone: '+33601020304',
        password: userPassword,
        avatar: null,
        plan: 'pro',
        role: 'user',
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
        resetPasswordCode: null,
        resetPasswordCodeExpires: null,
        refreshToken: null,
        status: 'active',
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstname: 'Marie',
        lastname: 'Martin',
        email: 'marie.martin@example.com',
        phone: '+33602030405',
        password: userPassword,
        avatar: null,
        plan: 'starter',
        role: 'user',
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
        resetPasswordCode: null,
        resetPasswordCodeExpires: null,
        refreshToken: null,
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstname: 'Pierre',
        lastname: 'Bernard',
        email: 'pierre.bernard@example.com',
        phone: '+33603040506',
        password: userPassword,
        avatar: null,
        plan: 'free',
        role: 'user',
        isVerified: false,
        verificationCode: '123456',
        verificationCodeExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        resetPasswordCode: null,
        resetPasswordCodeExpires: null,
        refreshToken: null,
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
