const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const { createClientSchema, updateClientSchema } = require('../validations/clientValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: إدارة بيانات العملاء والمحلات (منافذ البيع)
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: جلب جميع العملاء
 *     description: يمكن تصفية العملاء النشطين فقط والبحث عنهم بجزء من العنوان.
 *     tags: [Clients]
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
 *         description: قائمة العملاء
 *   post:
 *     summary: إضافة عميل/محل جديد
 *     tags: [Clients]
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
 *                 example: 201
 *               name:
 *                 type: string
 *                 example: "سوبر ماركت الهدى"
 *               phone:
 *                 type: string
 *                 example: "01123456789"
 *               address:
 *                 type: string
 *                 example: "القاهرة - مدينة نصر"
 *     responses:
 *       201:
 *         description: تم إضافة العميل بنجاح
 */
router
  .route('/')
  .get(clientController.getAllClients)
  .post(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(createClientSchema),
    clientController.createClient
  );

/**
 * @swagger
 * /api/clients/statement/{key}:
 *   get:
 *     summary: كشف حساب عميل
 *     description: جلب بيانات العميل مع جميع حركات المبيعات والمدفوعات (بحث بالكود أو الاسم)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: كود العميل أو جزء من اسمه
 *     responses:
 *       200:
 *         description: كشف الحساب مفصل
 *       404:
 *         description: العميل غير موجود
 */
router
  .route('/statement/:key')
  .get(
    authorize('Admin', 'GeneralAccountant'),
    clientController.getClientStatement
  );

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: جلب بيانات عميل واحد بالـ ID
 *     tags: [Clients]
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
 *         description: بيانات العميل
 *   put:
 *     summary: تعديل بيانات عميل
 *     tags: [Clients]
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
  .get(clientController.getClientById)
  .put(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(updateClientSchema),
    clientController.updateClient
  );

/**
 * @swagger
 * /api/clients/{id}/toggle-status:
 *   patch:
 *     summary: تنشيط/إيقاف عميل
 *     tags: [Clients]
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
 *         description: تم تغيير حالة العميل بنجاح
 */
router
  .patch('/:id/toggle-status',
    authorize('Admin'),
    clientController.toggleClientStatus
  );

module.exports = router;