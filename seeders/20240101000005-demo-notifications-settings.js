'use strict';

/**
 * Seeder : Notifications + Settings de démonstration
 */
module.exports = {
  async up(queryInterface) {
    // Notifications
    await queryInterface.bulkInsert('notifications', [
      {
        userId: 2,
        title: 'Bienvenue sur QR Platform !',
        message: 'Votre compte Pro est activé. Créez jusqu\'à 50 QR Codes dynamiques.',
        type: 'success',
        isRead: true,
        actionUrl: '/qr-codes/create',
        actionLabel: 'Créer mon premier QR Code',
        readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        userId: 2,
        title: 'Nouveau record de scans !',
        message: 'Votre QR Code "Menu Restaurant PDF" a dépassé les 1000 scans.',
        type: 'info',
        isRead: false,
        actionUrl: '/qr-codes/3/analytics',
        actionLabel: 'Voir les statistiques',
        readAt: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        userId: 2,
        title: 'Renouvellement abonnement',
        message: 'Votre abonnement Pro sera renouvelé dans 7 jours.',
        type: 'warning',
        isRead: false,
        actionUrl: '/subscription',
        actionLabel: 'Gérer mon abonnement',
        readAt: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        userId: 3,
        title: 'Bienvenue sur QR Platform !',
        message: 'Votre compte Starter est prêt. Commencez à créer vos QR Codes.',
        type: 'success',
        isRead: true,
        actionUrl: '/qr-codes/create',
        actionLabel: 'Créer un QR Code',
        readAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        userId: 4,
        title: 'Passez à la version Pro !',
        message: 'Débloquez 50 QR Codes et 10 000 scans/mois avec notre plan Pro.',
        type: 'promo',
        isRead: false,
        actionUrl: '/subscription/upgrade',
        actionLabel: 'Voir les offres',
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Settings (un par utilisateur)
    await queryInterface.bulkInsert('settings', [
      {
        userId: 1,
        language: 'fr',
        theme: 'dark',
        timezone: 'Europe/Paris',
        emailNotifications: true,
        pushNotifications: true,
        weeklyReport: true,
        dateFormat: 'DD/MM/YYYY',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 2,
        language: 'fr',
        theme: 'dark',
        timezone: 'Europe/Paris',
        emailNotifications: true,
        pushNotifications: true,
        weeklyReport: true,
        dateFormat: 'DD/MM/YYYY',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 3,
        language: 'fr',
        theme: 'light',
        timezone: 'Europe/Paris',
        emailNotifications: true,
        pushNotifications: false,
        weeklyReport: false,
        dateFormat: 'DD/MM/YYYY',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 4,
        language: 'fr',
        theme: 'system',
        timezone: 'Europe/Paris',
        emailNotifications: true,
        pushNotifications: true,
        weeklyReport: false,
        dateFormat: 'DD/MM/YYYY',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('settings', null, {});
    await queryInterface.bulkDelete('notifications', null, {});
  },
};
