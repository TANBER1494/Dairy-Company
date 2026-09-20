const Barn = require('../models/Barn');
const Cycle = require('../models/Cycle');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Create a new barn (Idempotent for Offline Sync)
 * @route   POST /api/barns
 * @access  Private (Supervisor)
 */
const addBarn = asyncHandler(async (req, res, next) => {
  const { local_id, name, barn_type, capacity } = req.body;
  const farmId = req.user.farm_id; // الاعتماد الصارم على مزرعة المشرف فقط

  if (!local_id || !name || !barn_type || !capacity) {
    return next(new AppError('جميع البيانات المطلوبة مفقودة (local_id, name, barn_type, capacity)', 400));
  }

  const existingBarn = await Barn.findOne({ local_id, farm_id: farmId });
  if (existingBarn) {
    return res.status(200).json({ 
      message: 'تمت مزامنة العنبر مسبقاً', 
      barn: existingBarn 
    });
  }

  const newBarn = await Barn.create({
    local_id,
    farm_id: farmId,
    name: name.trim(),
    barn_type,
    capacity: Number(capacity)
  });

  res.status(201).json({ 
    message: 'تم إنشاء العنبر بنجاح وجاهز لاستقبال دورات الإنتاج', 
    barn: newBarn 
  });
});

/**
 * @desc    Get all active barns for the supervisor's farm
 * @route   GET /api/barns
 * @access  Private (Supervisor)
 */
const getFarmBarns = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id;

  const barns = await Barn.find({ farm_id: farmId, deleted_at: null })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ count: barns.length, barns });
});

/**
 * @desc    Update barn details and handle referential integrity
 * @route   PUT /api/barns/:id
 * @access  Private (Supervisor)
 */
const updateBarn = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // قد يكون Mongo _id أو local_id بناءً على إعدادات الـ Routes لاحقاً
  const { name, barn_type, capacity, status } = req.body;
  const farmId = req.user.farm_id;
  
  const barn = await Barn.findOne({ _id: id, farm_id: farmId, deleted_at: null });
  if (!barn) {
    return next(new AppError('العنبر غير موجود أو لا تملك صلاحية تعديله', 404));
  }

  if (barn_type && barn_type !== barn.barn_type) {
    const hasCycles = await Cycle.exists({ barn_id: barn._id });
    if (hasCycles) {
      return next(new AppError('إجراء مرفوض تقنياً: لا يمكن تغيير نوع العنبر لوجود دورات إنتاج مسجلة عليه تاريخياً. قم بإنشاء عنبر جديد.', 400));
    }
    barn.barn_type = barn_type;
  }

  if (name) barn.name = name.trim();
  if (capacity) barn.capacity = Number(capacity);
  if (status) barn.status = status;

  await barn.save();
  res.status(200).json({ message: 'تم تحديث بيانات العنبر بنجاح', barn });
});

/**
 * @desc    Delete a barn (Hard Delete if no cycles exist)
 * @route   DELETE /api/barns/:id
 * @access  Private (Supervisor)
 */
const deleteBarn = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const farmId = req.user.farm_id;
  
  const barn = await Barn.findOne({ _id: id, farm_id: farmId, deleted_at: null });
  if (!barn) {
    return next(new AppError('العنبر غير موجود أو تم حذفه مسبقاً', 404));
  }

  const hasCycles = await Cycle.exists({ barn_id: barn._id });

  if (hasCycles) {
    barn.deleted_at = new Date();
    barn.status = 'INACTIVE';
    barn.name = `${barn.name}_مؤرشف_${Date.now()}`;
    await barn.save();

    return res.status(200).json({ 
      message: 'تم أرشفة العنبر بنجاح للحفاظ على التقارير القديمة. (تم تحرير الاسم لتتمكن من استخدامه لعنبر جديد)' 
    });
  } else {
    await Barn.deleteOne({ _id: barn._id });
    return res.status(200).json({ 
      message: 'تم حذف العنبر نهائياً لعدم وجود أي دورات إنتاجية مرتبطة به.' 
    });
  }
});

module.exports = { 
  addBarn, 
  getFarmBarns, 
  updateBarn, 
  deleteBarn 
};