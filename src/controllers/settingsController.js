const settingsService = require('../services/settingsService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Get supervisor settings and preferences
 * @route   GET /api/settings
 * @access  Private (Supervisor)
 */
const getSettings = asyncHandler(async (req, res, next) => {
  const settings = await settingsService.getSettings(req.user._id);
  res.status(200).json(settings);
});

/**
 * @desc    Update supervisor primary phone number and name
 * @route   PUT /api/settings/phone
 * @access  Private (Supervisor)
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const { new_phone, name } = req.body;

  const result = await settingsService.updateProfile(req.user._id, new_phone, name);

  if (result.isSame) {
    return res.status(200).json({
      message: 'تم إدخال نفس البيانات الحالية',
      phone: result.phone,
      name: result.name
    });
  }

  res.status(200).json({ 
    message: 'تم تحديث البيانات بنجاح', 
    phone: result.phone,
    name: result.name
  });
});

/**
 * @desc    Update account password securely
 * @route   PUT /api/settings/password
 * @access  Private (Supervisor)
 */
const updatePassword = asyncHandler(async (req, res, next) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return next(new AppError('جميع الحقول الخاصة بكلمة المرور مطلوبة', 400));
  }
  
  if (new_password !== confirm_password) {
    return next(new AppError('كلمة المرور الجديدة غير متطابقة مع حقل التأكيد', 400));
  }

  await settingsService.updatePassword(req.user._id, current_password, new_password);

  res.status(200).json({ 
    message: 'تم تحديث كلمة المرور بنجاح. لأسباب أمنية، يرجى تسجيل الدخول مجدداً من التطبيق.' 
  });
});

/**
 * @desc    Update UI preferences and notification settings
 * @route   PUT /api/settings/preferences
 * @access  Private (Supervisor)
 */
const updatePreferences = asyncHandler(async (req, res, next) => {
  await settingsService.updatePreferences(req.user._id, req.body);
  
  res.status(200).json({ 
    message: 'تم حفظ تفضيلات العرض وإعدادات الإشعارات بنجاح' 
  });
});

module.exports = {
  getSettings,
  updateProfile,
  updatePassword,
  updatePreferences,
};