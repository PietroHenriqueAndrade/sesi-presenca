const swaggerJsdoc = require('swagger-jsdoc');
const { getApiPublicUrl } = require('./serviceUrls');

const publicBase = getApiPublicUrl();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - Sistema de Presença Escolar (SENAI)',
      version: '1.1.0',
      description: 'API do TCC para autenticação, alunos, turmas, presenças, relatórios, dashboard e integração com IA.',
    },
    servers: [{ url: `${publicBase}/api/v1`, description: 'Servidor configurado' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.controller.js'],
};

module.exports = swaggerJsdoc(options);
