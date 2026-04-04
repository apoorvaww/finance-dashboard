const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboardController');
const { authenticate, isViewer, isAnalyst } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Summary analytics and trends
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Total income, expenses, and net balance
 *     tags: [Dashboard]
 *     description: |
 *       - **Viewer / Analyst / Admin**: all roles can access
 *       - Admins see platform-wide totals; others see their own
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_income:    { type: number }
 *                     total_expenses:  { type: number }
 *                     net_balance:     { type: number }
 *                     total_records:   { type: integer }
 */
router.get('/summary', authenticate, isViewer, ctrl.getSummary);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Category-wise income and expense totals
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *         description: Filter to only income or expense categories
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get('/categories', authenticate, isViewer, ctrl.getCategoryTotals);

/**
 * @swagger
 * /api/dashboard/trends/monthly:
 *   get:
 *     summary: Monthly income vs expense trends
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 6 }
 *         description: Number of past months to include
 *     responses:
 *       200:
 *         description: Monthly trend data
 */
router.get('/trends/monthly', authenticate, isViewer, ctrl.getMonthlyTrends);

/**
 * @swagger
 * /api/dashboard/trends/weekly:
 *   get:
 *     summary: Weekly income vs expense trends
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema: { type: integer, default: 8 }
 *         description: Number of past weeks to include
 *     responses:
 *       200:
 *         description: Weekly trend data
 */
router.get('/trends/weekly', authenticate, isViewer, ctrl.getWeeklyTrends);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Recent financial activity
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200:
 *         description: List of recent records
 */
router.get('/recent', authenticate, isViewer, ctrl.getRecentActivity);

/**
 * @swagger
 * /api/dashboard/top-categories:
 *   get:
 *     summary: Top spending categories with percentage share (Analyst & Admin)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Top expense categories ranked by total spend
 *       403:
 *         description: Forbidden — Analyst or Admin role required
 */
router.get('/top-categories', authenticate, isAnalyst, ctrl.getTopCategories);

module.exports = router;
