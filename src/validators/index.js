const { body, query, param } = require('express-validator');

// ── Auth validators ──────────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number.'),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role.'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

// ── User validators ──────────────────────────────────────────────────────────
const updateUserRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID.'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive.'),
];

// ── Financial Record validators ──────────────────────────────────────────────
const createRecordRules = [
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number.'),
  body('type')
    .notEmpty().withMessage('Type is required.')
    .isIn(['income', 'expense']).withMessage('Type must be income or expense.'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isLength({ max: 100 }).withMessage('Category max 100 characters.'),
  body('record_date')
    .optional()
    .isDate().withMessage('record_date must be a valid date (YYYY-MM-DD).'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes max 1000 characters.'),
];

const updateRecordRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid record ID.'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number.'),
  body('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type must be income or expense.'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category max 100 characters.'),
  body('record_date')
    .optional()
    .isDate().withMessage('record_date must be a valid date (YYYY-MM-DD).'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes max 1000 characters.'),
];

const recordFilterRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type filter.'),
  query('from_date').optional().isDate().withMessage('from_date must be YYYY-MM-DD.'),
  query('to_date').optional().isDate().withMessage('to_date must be YYYY-MM-DD.'),
  query('sort_by')
    .optional()
    .isIn(['record_date', 'amount', 'created_at', 'category'])
    .withMessage('Invalid sort field.'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sort_order must be asc or desc.'),
];

module.exports = {
  registerRules,
  loginRules,
  updateUserRules,
  createRecordRules,
  updateRecordRules,
  recordFilterRules,
};
