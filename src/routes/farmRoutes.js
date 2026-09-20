const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const farmValidation = require('../validations/farmValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription); 

router.get('/my-farm', farmController.getMyFarm);

router.put('/my-farm', validateRequest(farmValidation.updateFarmSchema), farmController.updateMyFarm);

module.exports = router;