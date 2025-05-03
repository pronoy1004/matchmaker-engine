const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Matchmaking Engine API',
      version: '1.0.0',
      description: 'API documentation for the in-memory matchmaking system',
    },
  },
  apis: ['./main.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
