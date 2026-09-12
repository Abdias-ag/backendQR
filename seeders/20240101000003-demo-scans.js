'use strict';

/**
 * Seeder : Scans de démonstration pour les statistiques
 */
module.exports = {
  async up(queryInterface) {
    const scans = [];
    const countries = [
      { country: 'France', countryCode: 'FR', city: 'Paris' },
      { country: 'France', countryCode: 'FR', city: 'Lyon' },
      { country: 'France', countryCode: 'FR', city: 'Marseille' },
      { country: 'Belgique', countryCode: 'BE', city: 'Bruxelles' },
      { country: 'Suisse', countryCode: 'CH', city: 'Genève' },
      { country: 'Canada', countryCode: 'CA', city: 'Montréal' },
      { country: 'Maroc', countryCode: 'MA', city: 'Casablanca' },
      { country: 'Allemagne', countryCode: 'DE', city: 'Berlin' },
    ];

    const devices = ['mobile', 'desktop', 'tablet'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Android', 'iOS', 'Windows', 'macOS', 'Linux'];
    const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '203.0.113.1', '198.51.100.1'];

    // Générer des scans pour les 30 derniers jours
    for (let qrCodeId = 1; qrCodeId <= 7; qrCodeId++) {
      const scanCount = Math.floor(Math.random() * 50) + 10;
      for (let i = 0; i < scanCount; i++) {
        const geo = countries[Math.floor(Math.random() * countries.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        scans.push({
          qrCodeId,
          ip: ips[Math.floor(Math.random() * ips.length)],
          country: geo.country,
          countryCode: geo.countryCode,
          city: geo.city,
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: oses[Math.floor(Math.random() * oses.length)],
          userAgent: 'Mozilla/5.0 (Demo Browser)',
          latitude: null,
          longitude: null,
          referer: null,
          scannedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        });
      }
    }

    await queryInterface.bulkInsert('qr_scans', scans);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('qr_scans', null, {});
  },
};
