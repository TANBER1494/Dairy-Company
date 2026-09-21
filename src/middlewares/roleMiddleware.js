const AppError = require('../utils/AppError');

/**
 * Middleware to check if the authenticated user has the required role.
 * @param {...string} roles - Allowed roles (e.g., 'Admin', 'InventoryAccountant').
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(`Security check failed: The role (${req.user?.role || 'Unknown'}) is not authorized to perform this action.`, 403)
      );
    }
    next();
  };
};

module.exports = { authorize };