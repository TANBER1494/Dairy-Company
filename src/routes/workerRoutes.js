const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const validateRequest = require('../middlewares/validateRequest');
const { createWorkerSchema, updateWorkerSchema } = require('../validations/workerValidation');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Workers
 *   description: إدارة العمال والمناديب
 */

/**
 * @swagger
 * /api/workers:
 *   get:
 *     summary: جلب جميع العمال
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: قائمة العمال
 *   post:
 *     summary: إضافة عامل جديد
 *     tags: [Workers]
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
 *                 example: "أحمد محمد"
 *               phone:
 *                 type: string
 *                 example: "01234567890"
 *     responses:
 *       201:
 *         description: تم إضافة العامل بنجاح
 */
router.route('/')
  .get(workerController.getAllWorkers)
  .post(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(createWorkerSchema),
    workerController.createWorker
  );

/**
 * @swagger
 * /api/workers/{id}:
 *   get:
 *     summary: جلب بيانات عامل
 *     tags: [Workers]
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
 *         description: بيانات العامل
 *   put:
 *     summary: تعديل بيانات عامل
 *     tags: [Workers]
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
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 */
router.route('/:id')
  .get(workerController.getWorkerById)
  .put(
    authorize('Admin', 'GeneralAccountant'),
    validateRequest(updateWorkerSchema),
    workerController.updateWorker
  );

/**
 * @swagger
 * /api/workers/{id}/toggle-status:
 *   patch:
 *     summary: تنشيط/إيقاف عامل
 *     tags: [Workers]
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
 *         description: تم تغيير حالة العامل بنجاح
 */
router.patch('/:id/toggle-status', authorize('Admin'), workerController.toggleWorkerStatus);

module.exports = router;