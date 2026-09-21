const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Middleware to protect routes by verifying the JWT token.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1) Get token and check if it's there
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('-password_hash');
    
    if (!currentUser || currentUser.deleted_at) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // 4) Check if user is active
    if (currentUser.status !== 'ACTIVE') {
      return next(new AppError('Your account has been suspended. Please contact the administrator.', 403));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    next(error);
  }
};

module.exports = { protect };