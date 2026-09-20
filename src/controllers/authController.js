const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const authService = require('../services/authService');

const registerSupervisor = asyncHandler(async (req, res, next) => {
  const { name, phone, email, password, farm_name } = req.body;

  if (!name || !phone || !email || !password || !farm_name) {
    return next(new AppError('جميع البيانات الأساسية مطلوبة (الاسم، الهاتف، البريد، كلمة المرور، اسم المزرعة)', 400));
  }

  const result = await authService.registerSupervisor(req.body);

  res.status(201).json({
    message: result.message
  });
});

const verifyRegistration = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const result = await authService.verifyRegistration(email, otp);

  res.status(200).json({
    message: 'تم تفعيل الحساب بنجاح',
    token: result.accessToken,
    refresh_token: result.refreshToken,
    user: result.user, 
  });
});

const resendActivationOTP = asyncHandler(async (req, res, next) => {
  await authService.resendActivationOTP(req.body.email);
  res.status(200).json({ message: 'تم إعادة إرسال كود التفعيل إلى بريدك الإلكتروني' });
});

const login = asyncHandler(async (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new AppError('يرجى إدخال رقم الهاتف وكلمة المرور', 400));
  }

  const result = await authService.login(phone, password);

  res.status(200).json({
    message: 'تم تسجيل الدخول بنجاح',
    token: result.accessToken,
    refresh_token: result.refreshToken,
    user: result.user,
  });
});

const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('يرجى إدخال البريد الإلكتروني', 400));
  }

  await authService.forgotPassword(email);

  res.status(200).json({
    message: 'تم إرسال كود التحقق (OTP) إلى بريدك الإلكتروني بنجاح',
  });
});

const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, new_password, confirm_password } = req.body;

  if (!email || !otp || !new_password || !confirm_password) {
    return next(new AppError('جميع الحقول مطلوبة لإعادة تعيين كلمة المرور', 400));
  }

  if (new_password !== confirm_password) {
    return next(new AppError('كلمة المرور غير متطابقة', 400));
  }

  await authService.resetPasswordWithOTP(email, otp, new_password);

  res.status(200).json({
    message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
  });
});

const refreshToken = asyncHandler(async (req, res, next) => {
  const { refresh_token } = req.body;

  const tokens = await authService.refreshAuthToken(refresh_token);

  res.status(200).json({
    message: 'تم تجديد الجلسة بنجاح',
    token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
});

const updateFcmToken = asyncHandler(async (req, res, next) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return next(new AppError('توكن الإشعارات مطلوب', 400));

  await authService.updateFcmToken(req.user._id, fcm_token);

  res.status(200).json({ message: 'تم تحديث توكن الإشعارات بنجاح' });
});

module.exports = {
  registerSupervisor,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  updateFcmToken,
  verifyRegistration,
  resendActivationOTP,
};