const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { loginSchema, refreshTokenSchema } = require('../validations/authValidation');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: مسارات المصادقة وتسجيل الدخول
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: تسجيل دخول موظف/أدمن
 *     description: يقوم بالتحقق من بيانات الدخول ويصدر Access Token و Refresh Token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "admin123456"
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *       400:
 *         description: بيانات مفقودة أو غير صالحة
 *       401:
 *         description: اسم المستخدم أو كلمة المرور غير صحيحة
 *       403:
 *         description: الحساب موقوف
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: تجديد الـ Access Token
 *     description: يستخدم لإصدار توكن جديد باستخدام الـ Refresh Token عند انتهاء الجلسة.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: تم تجديد الجلسة بنجاح
 *       401:
 *         description: الرمز غير صالح أو منتهي الصلاحية
 */
router.post('/refresh-token', validateRequest(refreshTokenSchema), authController.refreshToken);

/**
 * @swagger
 * /api/auth/setup:
 *   post:
 *     summary: إنشاء حساب المدير الأول (يستخدم لمرة واحدة فقط)
 *     description: يقوم بإنشاء حساب Admin افتراضي إذا لم يكن هناك أي مدير في النظام.
 *     tags: [Authentication]
 *     responses:
 *       201:
 *         description: تم إنشاء حساب المدير بنجاح
 *       400:
 *         description: حساب المدير موجود بالفعل، لا يمكن استخدام هذا المسار مجدداً
 */
router.post('/setup', authController.setupAdmin);

module.exports = router;