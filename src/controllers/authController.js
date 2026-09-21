const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const authService = require('../services/authService');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  const result = await authService.login(username, password);

  res.status(200).json({
    message: 'Login successful',
    token: result.accessToken,
    refresh_token: result.refreshToken,
    user: result.user,
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refresh_token } = req.body;

  const tokens = await authService.refreshAuthToken(refresh_token);

  res.status(200).json({
    message: 'Session refreshed successfully',
    token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
});

/**
 * @desc    Setup initial Admin user
 * @route   POST /api/auth/setup
 * @access  Public (Locks automatically after first use)
 */
const setupAdmin = asyncHandler(async (req, res, next) => {
  const result = await authService.setupInitialAdmin();
  res.status(201).json(result);
});

module.exports = {
  login,
  refreshToken,
  setupAdmin
};