const express = require('express');
const router = express.Router();

const validateRequest = require('../middlewares/validateRequest');
const authValidation = require('../validations/authValidation');
const { protect } = require('../middlewares/authMiddleware');

const authController = require('../controllers/authController');

router.post(
  '/register',
  validateRequest(authValidation.registerSchema),
  authController.registerSupervisor
);
router.post(
  '/verify',
  validateRequest(authValidation.verifySchema),
  authController.verifyRegistration
);
router.post(
  '/resend-otp',
  validateRequest(authValidation.emailOnlySchema),
  authController.resendActivationOTP
);

router.post(
  '/login',
  validateRequest(authValidation.loginSchema),
  authController.login
);

router.post(
  '/forgot-password',
  validateRequest(authValidation.emailOnlySchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  validateRequest(authValidation.resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshTokenSchema),
  authController.refreshToken
);

router.put(
  '/fcm-token',
  protect,
  validateRequest(authValidation.fcmTokenSchema),
  authController.updateFcmToken
);

module.exports = router;
