const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');
const { broadcastAppNotification } = require('./notificationController');

const getDashboardStats = asyncHandler(async (req, res, next) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(stats);
});

const getAllFarms = asyncHandler(async (req, res, next) => {
  const farms = await adminService.getAllFarms();
  res.status(200).json({ count: farms.length, farms });
});

const updateFarmStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const farm = await adminService.updateFarmStatus(req.params.id, status);
  res.status(200).json({ message: 'تم تحديث حالة المزرعة بنجاح', farm });
});

const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await adminService.getAllUsers();
  res.status(200).json({ count: users.length, users });
});

const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const user = await adminService.updateUserStatus(req.params.id, status);
  res.status(200).json({ message: 'تم تحديث حالة المشرف أمنياً بنجاح', user });
});

const updateUserPassword = asyncHandler(async (req, res, next) => {
  const { new_password } = req.body;
  
  if (!new_password) {
    return next(new AppError('كلمة المرور الجديدة مطلوبة', 400));
  }

  await adminService.updateUserPassword(req.params.id, new_password);
  
  res.status(200).json({ message: 'تم تغيير كلمة مرور المشرف وإغلاق جلساته النشطة بنجاح' });
});

const createPlan = asyncHandler(async (req, res, next) => {
  const plan = await adminService.createPlan(req.body);
  res.status(201).json({ message: 'تم إنشاء الباقة بنجاح', plan });
});

const getAdminPlans = asyncHandler(async (req, res, next) => {
  const plans = await adminService.getAllPlans(true); 
  res.status(200).json(plans);
});

const togglePlanStatus = asyncHandler(async (req, res, next) => {
  const plan = await adminService.togglePlanStatus(req.params.id);
  res.status(200).json({ message: 'تم تغيير حالة الباقة بنجاح', plan });
});

const getActivePlans = asyncHandler(async (req, res, next) => {
  const plans = await adminService.getAllPlans(false); 
  res.status(200).json(plans);
});

/**
 * @desc    Send Global Broadcast Notification
 * @route   POST /api/admin/broadcast
 * @access  Private (Super Admin)
 */
const sendGlobalBroadcast = asyncHandler(async (req, res, next) => {
  const { title, message, link } = req.body;

  if (!title || !message) {
    return next(new AppError('عنوان ورسالة الإشعار مطلوبان', 400));
  }

  const result = await broadcastAppNotification({ title, message, link });

  res.status(200).json({
    message: 'تم إرسال البث الإشعاري بنجاح لجميع المزارع النشطة',
    details: result
  });
});

const updatePlan = asyncHandler(async (req, res, next) => {
  const plan = await adminService.updatePlan(req.params.id, req.body);
  res.status(200).json({ message: 'تم تعديل الباقة بنجاح', plan });
});

const deletePlan = asyncHandler(async (req, res, next) => {
  await adminService.deletePlan(req.params.id);
  res.status(200).json({ message: 'تم حذف الباقة بنجاح' });
});

module.exports = {
  getDashboardStats,
  getAllFarms,
  updateFarmStatus,
  getAllUsers,
  updateUserStatus,
  createPlan,
  getAdminPlans,
  togglePlanStatus,
  getActivePlans,
  sendGlobalBroadcast,
  updateUserPassword,
  updatePlan,
  deletePlan
};