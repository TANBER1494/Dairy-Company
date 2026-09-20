const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const merchantValidation = require('../validations/merchantValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router.route('/')
  .post(validateRequest(merchantValidation.addMerchantSchema), merchantController.addMerchant)
  .get(merchantController.getMerchants);

router.route('/:id')
  .put(validateRequest(merchantValidation.updateMerchantSchema), merchantController.updateMerchant)
  .delete(merchantController.deleteMerchant);

router.get('/:id/statement', merchantController.getMerchantStatement);

router.post('/:id/payments', validateRequest(merchantValidation.recordPaymentSchema), merchantController.recordPayment);

router.post('/:id/representatives', validateRequest(merchantValidation.addRepresentativeSchema), merchantController.addRepresentative);
router.delete('/:id/representatives/:repId', merchantController.removeRepresentative);

module.exports = router;