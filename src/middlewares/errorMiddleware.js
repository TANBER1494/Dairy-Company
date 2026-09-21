const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'خطأ داخلي في الخادم';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = `بيانات غير صالحة: المعرّف (${err.value}) ليس بصيغة صحيحة.`;
  }

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (err.stack && statusCode >= 500) {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = { errorHandler };