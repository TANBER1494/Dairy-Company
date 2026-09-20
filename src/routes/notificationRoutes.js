const express = require('express');
const router = express.Router();
const validateRequest = require('../middlewares/validateRequest');
const notificationValidation = require('../validations/notificationValidation');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');


router.use(protect);

router.post(
  '/fcm-token',
  validateRequest(notificationValidation.fcmTokenSchema),
  notificationController.registerFcmToken
);
router.post(
  '/test',
  validateRequest(notificationValidation.testNotificationSchema),
  notificationController.testSendNotification
);

router.get('/', notificationController.getNotifications);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/read', notificationController.deleteAllReadNotifications);

router
  .route('/:id')
  .put(notificationController.markAsRead)
  .delete(notificationController.deleteNotification);


  router.post(
  '/broadcast',
  authorize('SUPER_ADMIN'), 
  validateRequest(notificationValidation.broadcastSchema),
  notificationController.sendBroadcast
);

module.exports = router;
