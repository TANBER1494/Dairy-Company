const platformPaymentService = require('../services/platformPaymentService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Submit a new payment request for subscription renewal
 * @route   POST /api/platform-payments
 * @access  Private (Supervisor)
 */
const submitPaymentRequest = asyncHandler(async (req, res, next) => {
  const { amount_paid, transfer_number, requested_months } = req.body;
  const farmId = req.user.farm_id;

  const numAmount = Number(amount_paid);
  const numMonths = Number(requested_months);

  if (!farmId || isNaN(numAmount) || numAmount <= 0 || !transfer_number || isNaN(numMonths) || numMonths <= 0) {
    return next(new AppError('جميع الحقول (المبلغ الصحيح، رقم التحويل، ومدة الباقة الصحيحة) مطلوبة', 400));
  }

  if (!req.file || !req.file.path) {
    return next(new AppError('صورة إيصال التحويل مطلوبة لاعتماد الدفع', 400));
  }

  const payment = await platformPaymentService.submitPaymentRequest(req.body, farmId, req.file.path);

  res.status(201).json({
    message: 'تم إرسال طلب التجديد بنجاح! سيتم تفعيل الباقة فور مراجعة الإيصال.',
    payment,
  });
});

/**
 * @desc    Get payment history for the current supervisor
 * @route   GET /api/platform-payments/history
 * @access  Private (Supervisor)
 */
const getSupervisorPaymentHistory = asyncHandler(async (req, res, next) => {
  const payments = await platformPaymentService.getSupervisorPaymentHistory(req.user.farm_id);
  res.status(200).json(payments);
});

/**
 * @desc    Clear payment history from supervisor view
 * @route   DELETE /api/platform-payments/history
 * @access  Private (Supervisor)
 */
const clearHistory = asyncHandler(async (req, res, next) => {
  await platformPaymentService.clearHistory(req.user.farm_id);
  res.status(200).json({ message: 'تم تنظيف السجل بنجاح' });
});

/**
 * @desc    Get all pending payments
 * @route   GET /api/platform-payments/pending
 * @access  Private (Super Admin)
 */
const getPendingPayments = asyncHandler(async (req, res, next) => {
  const pendingPayments = await platformPaymentService.getPendingPayments();
  res.status(200).json(pendingPayments);
});

/**
 * @desc    Review and process a payment request (Approve/Reject)
 * @route   PUT /api/platform-payments/:id/review
 * @access  Private (Super Admin)
 */
const reviewPaymentRequest = asyncHandler(async (req, res, next) => {
  const { action, admin_notes } = req.body;
  
  if (!action) {
    return next(new AppError('الرجاء تحديد الإجراء المطلوب (APPROVE أو REJECT)', 400));
  }

  const result = await platformPaymentService.reviewPaymentRequest(req.params.id, action, admin_notes);

  if (result.status === 'REJECTED') {
    return res.status(200).json({ message: 'تم رفض طلب الدفع بنجاح' });
  }

  return res.status(200).json({
    message: `تم اعتماد المبلغ وتمديد اشتراك المزرعة بنجاح لمدة ${result.months} شهر/شهور.`,
    new_end_date: result.newEndDate,
  });
});

/**
 * @desc    Get all resolved payments (History) for Admin
 * @route   GET /api/admin/payments/history
 * @access  Private (Super Admin)
 */
const getAdminPaymentHistory = asyncHandler(async (req, res, next) => {
  const history = await platformPaymentService.getAdminPaymentHistory();
  res.status(200).json(history);
});

/**
 * @desc    Clear payment history from Admin view (Archive)
 * @route   DELETE /api/admin/payments/history
 * @access  Private (Super Admin)
 */
const clearAdminHistory = asyncHandler(async (req, res, next) => {
  await platformPaymentService.clearAdminHistory();
  res.status(200).json({ message: 'تم تنظيف سجل التجديدات بنجاح' });
});

module.exports = {
  submitPaymentRequest,
  getSupervisorPaymentHistory,
  getPendingPayments,
  getAdminPaymentHistory,
  clearAdminHistory,
  reviewPaymentRequest,
  clearHistory,
};