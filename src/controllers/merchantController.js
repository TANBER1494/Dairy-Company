const merchantService = require('../services/merchantService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const addMerchant = asyncHandler(async (req, res, next) => {
  const { local_id, company_name } = req.body;
  const farmId = req.user.farm_id;

  if (!local_id || !company_name) {
    return next(new AppError('البيانات الأساسية (local_id، اسم الشركة) مطلوبة', 400));
  }

  const result = await merchantService.createMerchant({ 
    ...req.body, 
    farm_id: farmId,
    merchant_type: 'EGG_BUYER'
  });

  res.status(201).json({ 
    message: result.isDuplicate ? 'تمت المزامنة مسبقاً' : 'تم تسجيل التاجر بنجاح', 
    merchant: result.merchant 
  });
});

const getMerchants = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id;
  const merchants = await merchantService.getMerchants(farmId, req.query);
  res.status(200).json({ count: merchants.length, merchants });
});

const updateMerchant = asyncHandler(async (req, res, next) => {
  const merchant = await merchantService.updateMerchant(req.params.id, req.user.farm_id, req.body);
  res.status(200).json({ message: 'تم تحديث بيانات التاجر بنجاح', merchant });
});

const addRepresentative = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new AppError('اسم المندوب مطلوب', 400));
  const merchant = await merchantService.addRepresentative(req.params.id, req.user.farm_id, req.body);
  res.status(200).json({ message: 'تمت إضافة المندوب للتاجر بنجاح', merchant });
});

const removeRepresentative = asyncHandler(async (req, res, next) => {
  const merchant = await merchantService.removeRepresentative(req.params.id, req.params.repId, req.user.farm_id);
  res.status(200).json({ message: 'تم حذف المندوب بنجاح', merchant });
});

const getMerchantStatement = asyncHandler(async (req, res, next) => {
  const statement = await merchantService.getMerchantStatement(req.params.id, req.user.farm_id);
  res.status(200).json(statement);
});

const deleteMerchant = asyncHandler(async (req, res, next) => {
  await merchantService.deleteMerchant(req.params.id, req.user.farm_id);
  res.status(200).json({ message: 'تم حذف التاجر من النظام بشكل آمن' });
});

const recordPayment = asyncHandler(async (req, res, next) => {
  const { local_id, amount, type } = req.body;
  if (!local_id || !amount || !type) {
    return next(new AppError('المعرف المحلي، المبلغ، ونوع الدفعة (صرف/قبض) مطلوبان', 400));
  }
  const result = await merchantService.recordPayment(req.params.id, req.user.farm_id, req.body, req.user._id);
  res.status(201).json({ 
    message: result.isDuplicate ? 'تم تسجيل الدفعة مسبقاً' : 'تم تسجيل الدفعة النقدية بنجاح', 
    transaction: result.transaction 
  });
});

module.exports = {
  addMerchant,
  getMerchants,
  updateMerchant,
  addRepresentative,
  removeRepresentative,
  getMerchantStatement,
  deleteMerchant,
  recordPayment 
};