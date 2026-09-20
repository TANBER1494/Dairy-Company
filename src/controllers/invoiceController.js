const invoiceService = require('../services/invoiceService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Create a new invoice and handle partial payments (Offline-First Ready)
 * @route   POST /api/invoices
 * @access  Private (Supervisor)
 */
const createInvoice = asyncHandler(async (req, res, next) => {
  const { local_id, merchant_id, invoice_type, items, total_amount, invoice_date } = req.body;
  const farmId = req.user.farm_id;

  if (!local_id || !merchant_id || !invoice_type || !items || !total_amount || !invoice_date) {
    return next(new AppError('البيانات الأساسية للفاتورة غير مكتملة', 400));
  }

  const result = await invoiceService.createInvoice({ ...req.body, farm_id: farmId }, req.user._id);

  if (result.isDuplicate) {
    return res.status(200).json({
      message: 'تمت المزامنة مسبقاً',
      invoice: result.invoice,
    });
  }

  res.status(201).json({
    message: 'تم إصدار الفاتورة وتوجيه الحسابات بنجاح',
    invoice: result.invoice,
  });
});

/**
 * @desc    Get all invoices for supervisor's farm with filters
 * @route   GET /api/invoices
 * @access  Private (Supervisor)
 */
const getInvoices = asyncHandler(async (req, res, next) => {
  const farmId = req.user.farm_id;
  const invoices = await invoiceService.getInvoices(farmId, req.query);
  res.status(200).json({ count: invoices.length, invoices });
});

/**
 * @desc    Get single invoice details with its payment history
 * @route   GET /api/invoices/:id
 * @access  Private (Supervisor)
 */
const getInvoiceDetails = asyncHandler(async (req, res, next) => {
  const details = await invoiceService.getInvoiceDetails(req.params.id, req.user.farm_id);
  res.status(200).json(details);
});

/**
 * @desc    Delete an unpaid invoice safely
 * @route   DELETE /api/invoices/:id
 * @access  Private (Supervisor)
 */
const deleteInvoice = asyncHandler(async (req, res, next) => {
  await invoiceService.deleteInvoice(req.params.id, req.user.farm_id);
  res.status(200).json({ message: 'تم إلغاء الفاتورة من النظام بنجاح' });
});

/**
 * @desc    Update an invoice (Only allowed on the same creation day)
 * @route   PUT /api/invoices/:id
 * @access  Private (Supervisor)
 */
const updateInvoice = asyncHandler(async (req, res, next) => {
  const updatedInvoice = await invoiceService.updateInvoice(
    req.params.id, 
    req.user.farm_id, 
    req.body, 
    req.user._id
  );
  
  res.status(200).json({ 
    message: 'تم تعديل الفاتورة وتحديث المخازن بنجاح', 
    invoice: updatedInvoice 
  });
});

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceDetails,
  updateInvoice,
  deleteInvoice,
};