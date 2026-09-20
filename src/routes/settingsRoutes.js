const express = require('express');
const router = express.Router();
const validateRequest = require('../middlewares/validateRequest');
const settingsValidation = require('../validations/settingsValidation');
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');


router.use(protect);
router.use(authorize('SUPERVISOR', 'SUPER_ADMIN')); 

router.get('/', settingsController.getSettings);

router.put('/profile', validateRequest(settingsValidation.updateProfileSchema), settingsController.updateProfile);
router.put('/password', validateRequest(settingsValidation.updatePasswordSchema), settingsController.updatePassword);
router.put('/preferences', validateRequest(settingsValidation.updatePreferencesSchema), settingsController.updatePreferences);

module.exports = router;