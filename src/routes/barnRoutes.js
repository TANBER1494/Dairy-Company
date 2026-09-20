const express = require('express');
const router = express.Router();
const barnController = require('../controllers/barnController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const barnValidation = require('../validations/barnValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router
  .route('/')
  .post(validateRequest(barnValidation.addBarnSchema), barnController.addBarn)
  .get(barnController.getFarmBarns);

router
  .route('/:id')
  .put(
    validateRequest(barnValidation.updateBarnSchema),
    barnController.updateBarn
  )
  .delete(barnController.deleteBarn);

module.exports = router;
