const express = require('express');
const router = express.Router();
const supplierTransactionController = require('../controllers/supplierTransactionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const {
  createTransactionSchema,
  updateTransactionSchema,
  bulkCreateTransactionSchema,
} = require('../validations/supplierTransactionValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Supplier Transactions
 *   description: إدارة يومية الموردين (استلام الألبان ودفع الكاش)
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: جلب كل حركات الموردين
 *     description: يمكن فلترة الحركات لمورد محدد بإرسال ?supplier_id=xyz
 *     tags: [Supplier Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *         description: ID المورد
 *     responses:
 *       200:
 *         description: قائمة الحركات
 *   post:
 *     summary: تسجيل فاتورة توريد جديدة
 *     tags: [Supplier Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier_id
 *             properties:
 *               supplier_id:
 *                 type: string
 *               worker_id:
 *                 type: string
 *               product_id:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 example: 50
 *               unit_price:
 *                 type: number
 *                 example: 20
 *               paid_amount:
 *                 type: number
 *                 example: 500
 *               shift:
 *                 type: string
 *                 enum: [MORNING, EVENING]
 *                 example: "MORNING"
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم تسجيل الحركة بنجاح وتحديث المخزن
 */
router
  .route('/')
  .get(supplierTransactionController.getAllTransactions)
  .post(
    authorize('Admin', 'InventoryAccountant'),
    validateRequest(createTransactionSchema),
    supplierTransactionController.createTransaction
  );

/**
 * @swagger
 * /api/transactions/bulk:
 *   post:
 *     summary: إدخال مجمع لفواتير الموردين (Bulk Insert)
 *     description: مسار مخصص لبرمجة شاشة تشبه الإكسيل، يستقبل مصفوفة من الفواتير ويحفظها دفعة واحدة.
 *     tags: [Supplier Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     supplier_id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit_price:
 *                       type: number
 *                     paid_amount:
 *                       type: number
 *                 example:
 *                   - supplier_id: "64fc..."
 *                     quantity: 20
 *                     unit_price: 22
 *                     paid_amount: 0
 *                   - supplier_id: "64fd..."
 *                     quantity: 0
 *                     unit_price: 0
 *                     paid_amount: 1000
 *     responses:
 *       201:
 *         description: تم تسجيل الفواتير بنجاح
 */
router
  .route('/bulk')
  .post(
    authorize('Admin', 'InventoryAccountant', 'GeneralAccountant'),
    validateRequest(bulkCreateTransactionSchema),
    supplierTransactionController.bulkCreateTransactions
  );

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: تعديل فاتورة مورد (Rollback & Update)
 *     tags: [Supplier Transactions]
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
 *               quantity:
 *                 type: number
 *               paid_amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم التعديل وتحديث الأرصدة
 *   delete:
 *     summary: حذف فاتورة مورد وإلغاء تأثيرها المالي والمخزني
 *     tags: [Supplier Transactions]
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
  .put(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(updateTransactionSchema),
    supplierTransactionController.updateTransaction
  )
  .delete(authorize('Admin'), supplierTransactionController.deleteTransaction);

module.exports = router;