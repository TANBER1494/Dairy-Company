const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

/**
 * Generate Access and Refresh Tokens
 * @param {string} userId - The user's ID
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

  return { accessToken, refreshToken };
};

class AuthService {
  /**
   * Authenticate user and generate tokens
   * @param {string} username - User's username
   * @param {string} password - User's plain text password
   * @returns {Object} User data and tokens
   */
  async login(username, password) {
    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }

    const user = await User.findOne({ username: username.toLowerCase(), deleted_at: null })
      .select('+password_hash');
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid username or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Your account has been suspended. Please contact the administrator.', 403);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh authentication token
   * @param {string} token - The refresh token
   * @returns {Object} New access and refresh tokens
   */
  async refreshAuthToken(token) {
    if (!token) {
      throw new AppError('Refresh token is required', 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user || user.deleted_at || user.status !== 'ACTIVE') {
        throw new AppError('Invalid or inactive user account', 401);
      }

      return generateTokens(user._id);
    } catch (error) {
      throw new AppError('Session expired. Please log in again.', 401);
    }
  }

  /**
   * Temporary setup function to create the first Admin user
   * Should be disabled or removed after production deployment
   * @returns {Object} Created Admin user
   */
  async setupInitialAdmin() {
    const adminExists = await User.findOne({ role: 'Admin' });
    if (adminExists) {
      throw new AppError('Admin user already exists. Setup is locked.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123456', salt);

    const newAdmin = await User.create({
      name: 'System Admin',
      username: 'admin',
      password_hash: password_hash,
      role: 'Admin',
      status: 'ACTIVE'
    });

    return {
      message: 'Initial Admin created successfully. Please login and change the password immediately.',
      username: 'admin',
      password: 'admin123456'
    };
  }
}

module.exports = new AuthService();