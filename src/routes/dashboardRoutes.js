const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router.get('/supervisor', dashboardController.getSupervisorDashboard);

module.exports = router;