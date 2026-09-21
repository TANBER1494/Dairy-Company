const supplierTransactionService = require('../services/supplierTransactionService');
const asyncHandler = require('../utils/asyncHandler');
const { clearCache } = require('../middlewares/cacheMiddleware');

const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await supplierTransactionService.createTransaction(req.body, req.user._id);
  clearCache('dashboard');
  res.status(201).json({
    message: 'تم تسجيل حركة المورد وتحديث الأرصدة والمخزن بنجاح',
    data: transaction
  });
});

const getAllTransactions = asyncHandler(async (req, res) => {
  const filter = req.query.supplier_id ? { supplier_id: req.query.supplier_id } : {};
  const transactions = await supplierTransactionService.getAllTransactions(filter);
  
  res.status(200).json({
    count: transactions.length,
    data: transactions
  });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await supplierTransactionService.updateTransaction(req.params.id, req.body, req.user._id);
  clearCache('dashboard');
  res.status(200).json({ 
    message: 'تم تعديل الفاتورة وتحديث الأرصدة بنجاح', 
    data: transaction 
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await supplierTransactionService.deleteTransaction(req.params.id);
  clearCache('dashboard');
  res.status(200).json({ 
    message: 'تم إلغاء الفاتورة واسترداد الأرصدة للمخزن والمورد بنجاح' 
  });
});

const bulkCreateTransactions = asyncHandler(async (req, res) => {
  const transactions = await supplierTransactionService.bulkCreateTransactions(req.body.transactions, req.user._id);
  clearCache('dashboard');
  res.status(201).json({
    message: 'تم تسجيل مجموعة الفواتير وتحديث الأرصدة والمخزن بنجاح',
    count: transactions.length,
    data: transactions
  });
});

module.exports = {
  createTransaction,
  getAllTransactions,
  updateTransaction,
  deleteTransaction,
  bulkCreateTransactions
};