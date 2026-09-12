'use strict';

/**
 * Seeder : Abonnements de démonstration
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    await queryInterface.bulkInsert('subscriptions', [
      {
        userId: 1, // Admin - Enterprise
        plan: 'enterprise',
        price: 0.00,
        currency: 'EUR',
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: null,
        status: 'active',
        paymentMethod: 'free',
        transactionId: null,
        paymentMetadata: null,
        maxQrCodes: -1, // illimité
        maxScansPerMonth: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 2, // Jean Dupont - Pro
        plan: 'pro',
        price: 19.99,
        currency: 'EUR',
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        endDate: oneMonthLater,
        status: 'active',
        paymentMethod: 'stripe',
        transactionId: `txn_${Date.now()}_001`,
        paymentMetadata: JSON.stringify({ stripeCustomerId: 'cus_demo_001', stripePlanId: 'plan_pro_monthly' }),
        maxQrCodes: 50,
        maxScansPerMonth: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 3, // Marie Martin - Starter
        plan: 'starter',
        price: 9.99,
        currency: 'EUR',
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
        endDate: oneMonthLater,
        status: 'active',
        paymentMethod: 'card',
        transactionId: `txn_${Date.now()}_002`,
        paymentMetadata: JSON.stringify({ stripeCustomerId: 'cus_demo_002', stripePlanId: 'plan_starter_monthly' }),
        maxQrCodes: 20,
        maxScansPerMonth: 2000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 4, // Pierre Bernard - Free
        plan: 'free',
        price: 0.00,
        currency: 'EUR',
        startDate: now,
        endDate: null,
        status: 'active',
        paymentMethod: 'free',
        transactionId: null,
        paymentMetadata: null,
        maxQrCodes: 5,
        maxScansPerMonth: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('subscriptions', null, {});
  },
};
