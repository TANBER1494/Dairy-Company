const express = require('express');
const router = express.Router();
const validateRequest = require('../middlewares/validateRequest');
const platformPaymentValidation = require('../validations/platformPaymentValidation');
const platformPaymentController = require('../controllers/platformPaymentController');
const adminController = require('../controllers/adminController');

const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const upload = require('../utils/fileUpload'); 

router.use(protect);

router.get('/plans', authorize('SUPERVISOR'), adminController.getActivePlans);

router.post('/', 
  authorize('SUPERVISOR'), 
  upload.single('receipt_image'), 
  validateRequest(platformPaymentValidation.submitPaymentSchema), 
  platformPaymentController.submitPaymentRequest
);

router.get('/history', authorize('SUPERVISOR'), platformPaymentController.getSupervisorPaymentHistory);
router.delete('/history', authorize('SUPERVISOR'), platformPaymentController.clearHistory);
router.get('/pending', authorize('SUPER_ADMIN'), platformPaymentController.getPendingPayments);

router.put('/:id/review', 
  authorize('SUPER_ADMIN'), 
  validateRequest(platformPaymentValidation.reviewPaymentSchema), 
  platformPaymentController.reviewPaymentRequest
);

module.exports = router;