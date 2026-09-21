const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { createUserSchema, updateStatusSchema, resetPasswordSchema } = require('../validations/userValidation');

router.use(protect);
router.use(authorize('Admin')); // جميع مسارات المستخدمين تحتاج صلاحية مدير

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: إدارة حسابات الموظفين (المحاسبين والمديرين)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: جلب جميع حسابات الموظفين
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة الموظفين (باستثناء المحذوفين)
 *   post:
 *     summary: إنشاء حساب موظف جديد
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - role
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "محمود"
 *               username:
 *                 type: string
 *                 example: "mahmoud_acc"
 *               role:
 *                 type: string
 *                 enum: [Admin, InventoryAccountant, GeneralAccountant]
 *                 example: "GeneralAccountant"
 *               password:
 *                 type: string
 *                 example: "pass123456"
 *               phone:
 *                 type: string
 *                 example: "01011122233"
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب بنجاح
 */
router.route('/')
  .get(userController.getAllUsers)
  .post(validateRequest(createUserSchema), userController.createUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: تغيير حالة حساب موظف أمنياً (نشط / موقوف)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: تم تحديث الحالة بنجاح
 */
router.patch('/:id/status', validateRequest(updateStatusSchema), userController.updateUserStatus);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   patch:
 *     summary: إعادة ضبط كلمة مرور موظف
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *                 example: "newpass123"
 *     responses:
 *       200:
 *         description: تم تغيير كلمة المرور بنجاح
 */
router.patch('/:id/reset-password', validateRequest(resetPasswordSchema), userController.resetUserPassword);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: حذف حساب موظف (حذف مرن Soft Delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم الحذف المرن بنجاح
 */
router.delete('/:id', userController.deleteUser);

module.exports = router;