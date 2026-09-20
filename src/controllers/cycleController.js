const Cycle = require('../models/Cycle');
const cycleService = require('../services/cycleService');
const notificationController = require('../controllers/notificationController');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const startCycle = asyncHandler(async (req, res, next) => {
  const {
    local_id,
    barn_id,
    name,
    type,
    start_date,
    initial_bird_count,
  } = req.body;

  const farm_id = req.user.farm_id;
  const supervisor_id = req.user._id; 

  if (
    !local_id ||
    !barn_id ||
    !name ||
    !type ||
    !start_date ||
    !initial_bird_count
  ) {
    return next(new AppError('جميع بيانات بدء الدورة مطلوبة بما فيها المعرف المحلي (local_id)', 400));
  }
  
  if (Number(initial_bird_count) <= 0) {
    return next(new AppError('لا يمكن أن يكون عدد الطيور صفراً أو سالباً', 400));
  }

  const newCycle = await cycleService.startCycle(
    req.body,
    farm_id,
    supervisor_id
  );

  try {
    await notificationController.sendAppNotification({
      title: '🐣 دورة جديدة',
      message: `تم تسكين دورة جديدة (${name}) بنجاح.`,
      type: 'CYCLE_STARTED',
      target_role: 'SUPERVISOR', 
      target_user_id: supervisor_id,
      farm_id: farm_id,
      link: `/cycles`,
    });
  } catch (err) {
    console.error('فشل إرسال الإشعار:', err.message);
  }

  res.status(201).json({
    message: 'تم تسجيل الدورة بنجاح وتفعيل العنبر',
    cycle: newCycle,
  });
});

const getFarmCycles = asyncHandler(async (req, res, next) => {
  const farm_id = req.user.farm_id;
  const { status } = req.query;
  
  const query = { farm_id };
  if (status) query.status = status;

  const cycles = await Cycle.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ count: cycles.length, cycles });
});

const getCycleDetails = asyncHandler(async (req, res, next) => {
  const cycle = await Cycle.findOne({
    _id: req.params.id,
    farm_id: req.user.farm_id,
  })
    .populate('barn_id', 'name capacity barn_type')
    .lean();

  if (!cycle) {
    return next(new AppError('الدورة غير موجودة أو غير مصرح لك بالوصول إليها', 404));
  }
    
  res.status(200).json(cycle);
});

const closeCycle = asyncHandler(async (req, res, next) => {
  if (!req.body.end_date) {
    return next(new AppError('يجب تحديد تاريخ الإغلاق الفعلي للدورة', 400));
  }
  
  const cycle = await cycleService.closeCycle(
    req.params.id,
    req.body.end_date,
    req.user.farm_id
  );

  res.status(200).json({
    message: 'تم إغلاق الدورة وأرشفتها بنجاح، وتحويل العنبر لوضع الصيانة.',
    cycle_summary: {
      total_dead: cycle.total_dead_birds,
      mortality_rate: ((cycle.total_dead_birds / cycle.initial_bird_count) * 100).toFixed(2) + '%',
      total_feed: cycle.total_feed_consumed,
      total_eggs: cycle.total_eggs_produced,
    },
  });
});

module.exports = {
  startCycle,
  getFarmCycles,
  getCycleDetails,
  closeCycle,
};