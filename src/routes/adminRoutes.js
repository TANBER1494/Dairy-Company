const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const platformPaymentController = require('../controllers/platformPaymentController'); 

const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest'); 
const adminValidation = require('../validations/adminValidation'); 

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/farms', adminController.getAllFarms);
router.put('/farms/:id/status', 
  validateRequest(adminValidation.updateFarmStatusSchema), 
  adminController.updateFarmStatus
);

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', 
  validateRequest(adminValidation.updateUserStatusSchema), 
  adminController.updateUserStatus
); 

router.get('/payments/pending', platformPaymentController.getPendingPayments);
router.get('/payments/history', platformPaymentController.getAdminPaymentHistory);
router.delete('/payments/history', platformPaymentController.clearAdminHistory);
router.put('/payments/:id/review', platformPaymentController.reviewPaymentRequest);

router.post('/plans', 
  validateRequest(adminValidation.createPlanSchema), 
  adminController.createPlan
);
router.get('/plans', adminController.getAdminPlans);
router.patch('/plans/:id/toggle', adminController.togglePlanStatus);

router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

router.post('/broadcast', 
  validateRequest(adminValidation.broadcastSchema), 
  adminController.sendGlobalBroadcast
);

router.put('/users/:id/password', adminController.updateUserPassword);

module.exports = router;