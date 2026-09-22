const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { createCategorySchema, updateCategorySchema } = require('../validations/expenseCategoryValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Expense Categories
 *   description: إدارة فئات وبنود المصروفات (كهرباء، صيانة، إيجار...)
 */

/**
 * @swagger
 * /api/expense-categories:
 *   get:
 *     summary: جلب كل فئات المصروفات
 *     description: تدعم الكاش (Caching) لتخفيف الحمل على السيرفر. يمكن تصفية الفئات النشطة بإرسال ?active=true
 *     tags: [Expense Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: فلترة حسب حالة النشاط
 *     responses:
 *       200:
 *         description: قائمة فئات المصروفات
 *   post:
 *     summary: إضافة فئة مصروفات جديدة
 *     tags: [Expense Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "فاتورة كهرباء"
 *               description:
 *                 type: string
 *                 example: "مصاريف الكهرباء الشهرية للمعمل"
 *     responses:
 *       201:
 *         description: تم الإضافة بنجاح ومسح الكاش
 */
router.route('/')
  .get(
    cacheMiddleware(3600),
    expenseCategoryController.getAllCategories
  )
  .post(
    authorize('Admin', 'InventoryAccountant', 'GeneralAccountant'), 
    validateRequest(createCategorySchema), 
    expenseCategoryController.createCategory
  );

/**
 * @swagger
 * /api/expense-categories/{id}:
 *   put:
 *     summary: تعديل فئة مصروفات
 *     tags: [Expense Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم التعديل بنجاح
 */
router.route('/:id')
  .put(
    authorize('Admin', 'InventoryAccountant', 'GeneralAccountant'), 
    validateRequest(updateCategorySchema), 
    expenseCategoryController.updateCategory
  );

/**
 * @swagger
 * /api/expense-categories/{id}/toggle-status:
 *   patch:
 *     summary: تنشيط/إيقاف فئة مصروفات
 *     tags: [Expense Categories]
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
 *         description: تم تغيير الحالة بنجاح
 */
router.patch('/:id/toggle-status', authorize('Admin', 'InventoryAccountant', 'GeneralAccountant'), expenseCategoryController.toggleCategoryStatus);

module.exports = router;