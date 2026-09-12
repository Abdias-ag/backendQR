'use strict';

const app = require('./app');
const { connectDB, sequelize } = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connexion DB
    await connectDB();

    // Lancer le serveur Express — écoute sur 0.0.0.0 pour accepter les connexions réseau
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n==================================================`);
      console.log(`🚀 QR Platform Backend démarré sur le port ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📄 Swagger API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error.message);
    process.exit(1);
  }
};

startServer();
