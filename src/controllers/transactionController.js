const transactionService = require('../services/transactionService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Record a new financial transaction (Offline-First Ready)
 * @route   POST /api/transactions
 * @access  Private (Supervisor)
 */
const createTransaction = asyncHandler(async (req, res, next) => {
  const { local_id, type, category, amount, transaction_date } = req.body;
  const farmId = req.user.farm_id;

  if (!local_id || !type || !category || !amount || !transaction_date) {
    return next(new AppError('البيانات الأساسية للمعاملة المالية غير مكتملة', 400));
  }

  const numericAmount = Number(amount);
  if (numericAmount <= 0) {
    return next(new AppError('قيمة المعاملة يجب أن تكون أكبر من الصفر', 400));
  }

  const result = await transactionService.recordTransaction(
    { ...req.body, farm_id: farmId }, 
    req.user._id
  );

  if (result.isDuplicate) {
    return res.status(200).json({ 
      message: 'تمت مزامنة المعاملة مسبقاً', 
      transaction: result.transaction 
    });
  }

  res.status(201).json({
    message: 'تم تسجيل المعاملة المالية في الخزنة بنجاح',
    transaction: result.transaction
  });
});

/**
 * @desc    Get general ledger transactions with filters
 * @route   GET /api/transactions
 * @access  Private (Supervisor)
 */
const getTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await transactionService.getLedgerTransactions(req.user.farm_id, req.query);
  res.status(200).json({ count: transactions.length, transactions });
});

/**
 * @desc    Get treasury balance summary (Safe Balance)
 * @route   GET /api/transactions/balance
 * @access  Private (Supervisor)
 */
const getTreasuryBalance = asyncHandler(async (req, res, next) => {
  const balance = await transactionService.getTreasuryBalance(req.user.farm_id);
  res.status(200).json(balance);
});

module.exports = {
  createTransaction,
  getTransactions,
  getTreasuryBalance
};