const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { checkSubscription } = require('../middlewares/subscriptionMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const inventoryValidation = require('../validations/inventoryValidation');

router.use(protect);
router.use(authorize('SUPERVISOR'));
router.use(checkSubscription);

router
  .route('/items')
  .post(validateRequest(inventoryValidation.addInventoryItemSchema), inventoryController.addInventoryItem)
  .get(inventoryController.getInventoryItems);

router
  .route('/items/:id')
  .put(validateRequest(inventoryValidation.updateInventoryItemSchema), inventoryController.updateInventoryItem)
  .delete(inventoryController.deleteInventoryItem);

router.post(
  '/movements', 
  validateRequest(inventoryValidation.recordMovementSchema), 
  inventoryController.recordInventoryMovement
);

router.get('/movements/item/:item_id', inventoryController.getItemMovements);

router.post(
  '/produce-feed', 
  validateRequest(inventoryValidation.produceFeedSchema), 
  inventoryController.produceFeed
);

router.post(
  '/dokhan', 
  validateRequest(inventoryValidation.recordDokhanSchema), 
  inventoryController.recordDokhan
);

router.put(
  '/dokhan/:id', 
  validateRequest(inventoryValidation.updateDokhanSchema), 
  inventoryController.updateDokhan
);

module.exports = router;