const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/recordController');
const { authenticate, isAdmin, isViewer } = require('../middleware/auth');
const { validate }                         = require('../middleware/validate');
const {
  createRecordRules,
  updateRecordRules,
  recordFilterRules,
} = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial record management
 */

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: List financial records (with filtering & pagination)
 *     tags: [Records]
 *     description: |
 *       - **Viewer / Analyst**: sees only their own records
 *       - **Admin**: sees all records (optionally filter by user_id)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Partial match (case-insensitive)
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sort_by
 *         schema: { type: string, enum: [record_date, amount, created_at, category], default: record_date }
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: user_id
 *         schema: { type: integer }
 *         description: Admin only — filter records for a specific user
 *     responses:
 *       200:
 *         description: Paginated financial records
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, isViewer, recordFilterRules, validate, ctrl.getAll);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single financial record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Record object
 *       403:
 *         description: Access denied (not your record)
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, isViewer, ctrl.getOne);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a financial record (Admin only)
 *     tags: [Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category]
 *             properties:
 *               amount:      { type: number, example: 1500.00 }
 *               type:        { type: string, enum: [income, expense] }
 *               category:    { type: string, example: Salary }
 *               record_date: { type: string, format: date, example: "2024-03-01" }
 *               notes:       { type: string, example: Monthly salary payment }
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Forbidden
 *       422:
 *         description: Validation error
 */
router.post('/', authenticate, isAdmin, createRecordRules, validate, ctrl.create);

/**
 * @swagger
 * /api/records/{id}:
 *   patch:
 *     summary: Update a financial record (Admin only)
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:      { type: number }
 *               type:        { type: string, enum: [income, expense] }
 *               category:    { type: string }
 *               record_date: { type: string, format: date }
 *               notes:       { type: string }
 *     responses:
 *       200:
 *         description: Record updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.patch('/:id', authenticate, isAdmin, updateRecordRules, validate, ctrl.update);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Soft-delete a financial record (Admin only)
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Record deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticate, isAdmin, ctrl.remove);

module.exports = router;
