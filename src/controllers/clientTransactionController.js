const clientTransactionService = require('../services/clientTransactionService');
const asyncHandler = require('../utils/asyncHandler');
const { clearCache } = require('../middlewares/cacheMiddleware');

const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await clientTransactionService.createTransaction(req.body, req.user._id);
  clearCache('dashboard');
  res.status(201).json({
    message: 'تم تسجيل حركة المبيعات وتحديث رصيد العميل وخصم المخزن بنجاح',
    data: transaction
  });
});

const getAllTransactions = asyncHandler(async (req, res) => {
  const filter = req.query.client_id ? { client_id: req.query.client_id } : {};
  const transactions = await clientTransactionService.getAllTransactions(filter);
  
  res.status(200).json({
    count: transactions.length,
    data: transactions
  });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await clientTransactionService.updateTransaction(req.params.id, req.body, req.user._id);
  clearCache('dashboard');
  res.status(200).json({ 
    message: 'تم تعديل الفاتورة وتحديث الأرصدة بنجاح', 
    data: transaction 
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  await clientTransactionService.deleteTransaction(req.params.id);
  clearCache('dashboard');
  res.status(200).json({ 
    message: 'تم إلغاء الفاتورة واسترداد الأرصدة للمخزن والعميل بنجاح' 
  });
});

const bulkCreateTransactions = asyncHandler(async (req, res) => {
  const transactions = await clientTransactionService.bulkCreateTransactions(req.body.transactions, req.user._id);
  clearCache('dashboard');
  res.status(201).json({
    message: 'تم تسجيل مجموعة فواتير المبيعات وتحديث الأرصدة بنجاح',
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