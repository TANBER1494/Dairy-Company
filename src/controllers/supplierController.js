const supplierService = require('../services/supplierService');
const asyncHandler = require('../utils/asyncHandler');

const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  res.status(201).json({ message: 'تم إضافة المورد بنجاح', data: supplier });
});

const getAllSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await supplierService.getAllSuppliers(req.query);
  res.status(200).json({ count: suppliers.length, data: suppliers });
});

const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  res.status(200).json({ data: supplier });
});

const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  res.status(200).json({ message: 'تم تحديث بيانات المورد بنجاح', data: supplier });
});

const toggleSupplierStatus = asyncHandler(async (req, res) => {
  const supplier = await supplierService.toggleSupplierStatus(req.params.id);
  res.status(200).json({
    message: `تم ${supplier.is_active ? 'تنشيط' : 'إيقاف'} المورد بنجاح`,
    data: supplier,
  });
});

const getSupplierStatement = asyncHandler(async (req, res) => {
  const statement = await supplierService.getSupplierStatement(req.params.key);
  res.status(200).json({ message: 'تم استخراج كشف حساب المورد بنجاح', data: statement });
});

const settleSupplierAccount = asyncHandler(async (req, res) => {
  const supplier = await supplierService.settleAccount(req.params.id, req.body, req.user._id);
  res.status(200).json({
    message: 'تم تصفية حساب المورد وإغلاق الفواتير السابقة بنجاح',
    data: supplier
  });
});

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  toggleSupplierStatus,
  getSupplierStatement,
  settleSupplierAccount
};