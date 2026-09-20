const express = require('express');
const router = express.Router();
const dailyLogController = require('../controllers/dailyLogController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const dailyLogValidation = require('../validations/dailyLogValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router.post('/bulk', validateRequest(dailyLogValidation.createBulkLogsSchema), dailyLogController.createBulkDailyLogs); 
router.put('/bulk-update', validateRequest(dailyLogValidation.updateBulkLogsSchema), dailyLogController.updateBulkDailyLogs);
router.get('/cycle/:cycle_id', dailyLogController.getCycleDailyLogs);

module.exports = router;