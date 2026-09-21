const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: لوحة القيادة والتقارير المالية التجميعية
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: استخراج تقرير لوحة القيادة الشامل
 *     description: يجلب تدفقات النقدية (مبيعات، مشتريات، مصروفات، خزينة)، ديون الموردين والعملاء، وجرد المخزن. يدعم الكاشينج ويدعم الفلترة بالتاريخ.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية (مثال 2026-09-01)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية (مثال 2026-09-30)
 *     responses:
 *       200:
 *         description: بيانات لوحة القيادة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     financialFlow:
 *                       type: object
 *                     balances:
 *                       type: object
 *                     inventory:
 *                       type: array
 */
router.get(
  '/summary',
  authorize('Admin', 'GeneralAccountant'),
  cacheMiddleware(600),
  dashboardController.getDashboardSummary
);

module.exports = router;