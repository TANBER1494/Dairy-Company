const dailyLogService = require('../services/dailyLogService');
const notificationController = require('../controllers/notificationController');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createBulkDailyLogs = asyncHandler(async (req, res, next) => {
  const { logs } = req.body;
  const farmId = req.user.farm_id;
  if (!logs || !Array.isArray(logs) || logs.length === 0)
    return next(new AppError('لا توجد بيانات', 400));

  const result = await dailyLogService.createBulkDailyLogs(
    logs,
    req.user._id,
    farmId
  );
  try {
    if (result.highMortalityAlerts && result.highMortalityAlerts.length > 0) {
      const alertDetails = result.highMortalityAlerts
        .map((a) => `${a.barn_name} (${a.dead_count} نافق)`)
        .join('، ');
      await notificationController.sendAppNotification({
        title: '🚨 تنبيه طارئ: نافق مرتفع',
        message: `نافق مرتفع: ${alertDetails}.`,
        type: 'HIGH_MORTALITY',
        target_role: 'SUPERVISOR',
        farm_id: farmId,
        link: `/dashboard`,
      });
    }
  } catch (e) {}

  res.status(201).json({ message: `تم التسجيل بنجاح`, logs: result.logs });
});

const updateBulkDailyLogs = asyncHandler(async (req, res, next) => {
  const { old_date, new_date, logs } = req.body;
  const farmId = req.user.farm_id;

  const updatedLogs = await dailyLogService.updateBulkDailyLogs(
    old_date,
    new_date,
    logs,
    req.user._id,
    farmId
  );

  res
    .status(200)
    .json({
      message: 'تم تعديل اليوميات وتحديث المخازن بنجاح',
      logs: updatedLogs,
    });
});

const getCycleDailyLogs = asyncHandler(async (req, res, next) => {
  const logs = await dailyLogService.getLogsByCycle(
    req.params.cycle_id,
    req.user.farm_id
  );
  res.status(200).json({ count: logs.length, logs });
});

module.exports = {
  createBulkDailyLogs,
  updateBulkDailyLogs,
  getCycleDailyLogs,
};
