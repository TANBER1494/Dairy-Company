const farmService = require('../services/farmService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Get the supervisor's farm details and current feed stock
 * @route   GET /api/farms/my-farm
 * @access  Private (Supervisor)
 */
const getMyFarm = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id;
  if (!farmId) {
    return next(new AppError('لا توجد مزرعة مرتبطة بحسابك', 404));
  }

  const farm = await farmService.getFarmDetails(farmId);

  res.status(200).json({ farm });
});

/**
 * @desc    Update supervisor's farm basic details
 * @route   PUT /api/farms/my-farm
 * @access  Private (Supervisor)
 */
const updateMyFarm = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id;
  if (!farmId) {
    return next(new AppError('لا توجد مزرعة مرتبطة بحسابك', 404));
  }

  const farm = await farmService.updateFarm(farmId, req.body);
  
  res.status(200).json({ message: 'تم تحديث بيانات المزرعة بنجاح', farm });
});

module.exports = { 
  getMyFarm, 
  updateMyFarm 
};