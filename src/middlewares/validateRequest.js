const AppError = require('../utils/AppError');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((err) => err.message).join(' | ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

module.exports = validateRequest;
