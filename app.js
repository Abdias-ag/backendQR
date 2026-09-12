'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Middlewares globaux
app.use(helmet({
  crossOriginResourcePolicy: false, // Nécessaire pour servir les images d'uploads publiquement
}));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.0.197:3001',
    'http://localhost:8081',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Limiteur de débit global sur l'API
app.use('/api', apiLimiter);

// Servir le dossier d'uploads publiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QR Platform SaaS API',
      version: '1.0.0',
      description: 'Documentation de la plateforme professionnelle de génération de QR Codes Dynamiques',
      contact: {
        name: 'Support Technique',
        email: 'support@qr-platform.com',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:5000',
        description: 'Serveur Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, './routes/*.js'),
    path.join(__dirname, './controllers/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Redirection de la racine vers api-docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Enregistrement de toutes les routes
app.use(routes);

// Gestion des routes non trouvées (404)
app.use(notFound);

// Gestionnaire d'erreurs global (500, Sequelize, etc.)
app.use(errorHandler);

module.exports = app;
