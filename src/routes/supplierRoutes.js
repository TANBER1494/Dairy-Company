const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const {
  createSupplierSchema,
  updateSupplierSchema,
} = require('../validations/supplierValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: إدارة بيانات الموردين (المزارع والأشخاص)
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: جلب جميع الموردين
 *     description: يمكن تصفية الموردين النشطين فقط والبحث عنهم بجزء من العنوان.
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: فلترة حسب حالة النشاط (true / false)
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         description: بحث بجزء من العنوان (مثال أسيوط)
 *     responses:
 *       200:
 *         description: قائمة الموردين
 *   post:
 *     summary: إضافة مورد جديد
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: number
 *                 example: 101
 *               name:
 *                 type: string
 *                 example: "مزرعة الأمل"
 *               phone:
 *                 type: string
 *                 example: "01012345678"
 *               address:
 *                 type: string
 *                 example: "أسيوط"
 *     responses:
 *       201:
 *         description: تم إضافة المورد بنجاح
 */
router
  .route('/')
  .get(supplierController.getAllSuppliers)
  .post(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(createSupplierSchema),
    supplierController.createSupplier
  );

/**
 * @swagger
 * /api/suppliers/statement/{key}:
 *   get:
 *     summary: كشف حساب مورد
 *     description: جلب بيانات المورد مع جميع حركاته المالية (بحث بالكود أو الاسم)
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: كود المورد أو جزء من اسمه
 *     responses:
 *       200:
 *         description: كشف الحساب مفصل
 *       404:
 *         description: المورد غير موجود
 */
router
  .route('/statement/:key')
  .get(
    authorize('Admin', 'GeneralAccountant'),
    supplierController.getSupplierStatement
  );

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: جلب بيانات مورد واحد بالـ ID
 *     tags: [Suppliers]
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
 *         description: بيانات المورد
 *   put:
 *     summary: تعديل بيانات مورد
 *     tags: [Suppliers]
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
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 */
router
  .route('/:id')
  .get(supplierController.getSupplierById)
  .put(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(updateSupplierSchema),
    supplierController.updateSupplier
  );

/**
 * @swagger
 * /api/suppliers/{id}/toggle-status:
 *   patch:
 *     summary: تنشيط/إيقاف مورد
 *     tags: [Suppliers]
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
 *         description: تم تغيير حالة المورد بنجاح
 */
router.patch(
  '/:id/toggle-status',
  authorize('Admin'),
  supplierController.toggleSupplierStatus
);

module.exports = router;