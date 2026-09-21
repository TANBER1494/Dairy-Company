const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dairy Company ERP API',
      version: '1.0.0',
      description: 'التوثيق الرسمي لواجهة برمجة التطبيقات (API) الخاصة بنظام إدارة معمل الألبان.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'سيرفر التطوير (Development)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'أدخل الـ Access Token هنا مباشرة (بدون كلمة Bearer)',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;