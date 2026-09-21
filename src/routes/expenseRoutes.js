const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const { createExpenseSchema, updateExpenseSchema } = require('../validations/expenseValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: تسجيل وإدارة حركات المصروفات اليومية
 */

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: جلب كل المصروفات
 *     description: يمكن فلترة المصروفات حسب فئة معينة بإرسال ?category_id=xyz
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: ID الفئة
 *     responses:
 *       200:
 *         description: قائمة المصروفات
 *   post:
 *     summary: تسجيل مصروف جديد
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_id
 *               - amount
 *             properties:
 *               category_id:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 350
 *               shift:
 *                 type: string
 *                 enum: [MORNING, EVENING]
 *                 example: "MORNING"
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *                 example: "شراء لمبات للصالة"
 *     responses:
 *       201:
 *         description: تم تسجيل المصروف ومسح كاش الخزينة
 */
router
  .route('/')
  .get(expenseController.getAllExpenses)
  .post(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(createExpenseSchema),
    expenseController.createExpense
  );

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: جلب بيانات مصروف واحد
 *     tags: [Expenses]
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
 *         description: بيانات المصروف
 *   put:
 *     summary: تعديل حركة مصروف
 *     tags: [Expenses]
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
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 *   delete:
 *     summary: حذف حركة مصروف
 *     tags: [Expenses]
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
 *         description: تم الحذف بنجاح
 */
router
  .route('/:id')
  .get(expenseController.getExpenseById)
  .put(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(updateExpenseSchema),
    expenseController.updateExpense
  )
  .delete(
    authorize('Admin'), 
    expenseController.deleteExpense
  );

module.exports = router;