const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const workerValidation = require('../validations/workerValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router.route('/')
  .post(validateRequest(workerValidation.addWorkerSchema), workerController.addWorker)
  .get(workerController.getWorkers);

router.post('/log', validateRequest(workerValidation.recordLogSchema), workerController.recordWorkerLog);
router.post('/settle', validateRequest(workerValidation.settleAccountSchema), workerController.settleWorkerAccount);

router.get('/:worker_id/statement', workerController.getWorkerStatement);
router.put('/:worker_id/status', validateRequest(workerValidation.changeStatusSchema), workerController.changeWorkerStatus);
router.get('/logs', workerController.getWorkerLogs);

module.exports = router;