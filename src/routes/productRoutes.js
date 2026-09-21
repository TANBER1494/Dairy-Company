const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const { createProductSchema, updateProductSchema } = require('../validations/productValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: إدارة المنتجات والمخزون
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: جلب جميع المنتجات
 *     description: يمكن تصفية المنتجات النشطة بإرسال ?active=true
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: قائمة المنتجات
 *   post:
 *     summary: إضافة منتج جديد
 *     tags: [Products]
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
 *                 example: 301
 *               name:
 *                 type: string
 *                 example: "جبنة بيضاء"
 *               current_price:
 *                 type: number
 *                 example: 50
 *               current_stock:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: تم إضافة المنتج بنجاح
 */
router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authorize('Admin', 'InventoryAccountant'),
    validateRequest(createProductSchema),
    productController.createProduct
  );

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: جلب بيانات منتج بالـ ID
 *     tags: [Products]
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
 *         description: بيانات المنتج
 *   put:
 *     summary: تعديل منتج
 *     tags: [Products]
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
 *               current_price:
 *                 type: number
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 */
router
  .route('/:id')
  .get(productController.getProductById)
  .put(
    authorize('Admin', 'InventoryAccountant'),
    validateRequest(updateProductSchema),
    productController.updateProduct
  );

/**
 * @swagger
 * /api/products/{id}/toggle-status:
 *   patch:
 *     summary: تنشيط/إيقاف منتج
 *     tags: [Products]
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
 *         description: تم تغيير حالة المنتج بنجاح
 */
router
  .patch('/:id/toggle-status', 
    authorize('Admin'),
    productController.toggleProductStatus
  );

module.exports = router;