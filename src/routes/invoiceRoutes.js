const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const invoiceValidation = require('../validations/invoiceValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router.route('/')
  .post(validateRequest(invoiceValidation.createInvoiceSchema), invoiceController.createInvoice)
  .get(invoiceController.getInvoices);

router.route('/:id')
  .get(invoiceController.getInvoiceDetails)
  .put(validateRequest(invoiceValidation.updateInvoiceSchema), invoiceController.updateInvoice) // 🚀 مسار التعديل
  .delete(invoiceController.deleteInvoice);

module.exports = router;