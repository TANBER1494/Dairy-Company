const express = require('express');
const router = express.Router();
const clientTransactionController = require('../controllers/clientTransactionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const {
  createTransactionSchema,
  updateTransactionSchema,
  bulkCreateTransactionSchema,
} = require('../validations/clientTransactionValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Client Transactions
 *   description: إدارة مبيعات العملاء وتوزيع الألبان
 */

/**
 * @swagger
 * /api/client-transactions:
 *   get:
 *     summary: جلب كل حركات العملاء (المبيعات)
 *     description: يمكن فلترة الحركات لعميل محدد بإرسال ?client_id=xyz
 *     tags: [Client Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: client_id
 *         schema:
 *           type: string
 *         description: ID العميل
 *     responses:
 *       200:
 *         description: قائمة فواتير المبيعات
 *   post:
 *     summary: تسجيل فاتورة مبيعات جديدة
 *     tags: [Client Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_id
 *             properties:
 *               client_id:
 *                 type: string
 *               worker_id:
 *                 type: string
 *               product_id:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 example: 30
 *               unit_price:
 *                 type: number
 *                 example: 25
 *               paid_amount:
 *                 type: number
 *                 example: 200
 *               shift:
 *                 type: string
 *                 enum: [MORNING, EVENING]
 *                 example: "EVENING"
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم تسجيل فاتورة المبيعات بنجاح وخصم الكمية من المخزن
 */
router
  .route('/')
  .get(clientTransactionController.getAllTransactions)
  .post(
    authorize('Admin', 'InventoryAccountant', 'GeneralAccountant'),
    validateRequest(createTransactionSchema),
    clientTransactionController.createTransaction
  );

/**
 * @swagger
 * /api/client-transactions/bulk:
 *   post:
 *     summary: إدخال مجمع لفواتير العملاء (Bulk Insert)
 *     description: مسار مخصص لحفظ مصفوفة من فواتير المبيعات وتحصيل النقدية دفعة واحدة.
 *     tags: [Client Transactions]
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
 *                     client_id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit_price:
 *                       type: number
 *                     paid_amount:
 *                       type: number
 *                 example:
 *                   - client_id: "64aa..."
 *                     quantity: 10
 *                     unit_price: 25
 *                     paid_amount: 250
 *                   - client_id: "64bb..."
 *                     quantity: 0
 *                     unit_price: 0
 *                     paid_amount: 500
 *     responses:
 *       201:
 *         description: تم تسجيل الفواتير بنجاح
 */
router
  .route('/bulk')
  .post(
    authorize('Admin', 'InventoryAccountant', 'GeneralAccountant'),
    validateRequest(bulkCreateTransactionSchema),
    clientTransactionController.bulkCreateTransactions
  );

/**
 * @swagger
 * /api/client-transactions/{id}:
 *   put:
 *     summary: تعديل فاتورة مبيعات عميل (Rollback & Update)
 *     tags: [Client Transactions]
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
 *         description: تم التعديل وتحديث الأرصدة بنجاح
 *   delete:
 *     summary: حذف فاتورة مبيعات عميل وإلغاء تأثيرها المالي والمخزني
 *     tags: [Client Transactions]
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
    authorize('Admin', 'InventoryAccountant', 'GeneralAccountant'),
    validateRequest(updateTransactionSchema),
    clientTransactionController.updateTransaction
  )
  .delete(authorize('Admin'), clientTransactionController.deleteTransaction);

module.exports = router;