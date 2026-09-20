const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const transactionValidation = require('../validations/transactionValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription); 

router.post('/', validateRequest(transactionValidation.createTransactionSchema), transactionController.createTransaction);

router.get('/', transactionController.getTransactions);
router.get('/balance', transactionController.getTreasuryBalance);

module.exports = router;