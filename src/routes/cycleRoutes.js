const express = require('express');
const router = express.Router();
const cycleController = require('../controllers/cycleController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

// استدعاء ملفات التحقق
const validateRequest = require('../middlewares/validateRequest');
const cycleValidation = require('../validations/cycleValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router
  .route('/')
  .post(
    validateRequest(cycleValidation.startCycleSchema),
    cycleController.startCycle
  )
  .get(cycleController.getFarmCycles);

router.route('/:id').get(cycleController.getCycleDetails);

router.put(
  '/:id/close',
  validateRequest(cycleValidation.closeCycleSchema),
  cycleController.closeCycle
);

module.exports = router;
