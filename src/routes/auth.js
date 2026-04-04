const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');
const { registerRules, loginRules } = require('../validators');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login, and profile
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: Alice Smith }
 *               email:    { type: string, example: alice@example.com }
 *               password: { type: string, example: Alice@1234 }
 *               role:     { type: string, enum: [viewer, analyst, admin], default: viewer }
 *     responses:
 *       201:
 *         description: Registered successfully
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
router.post('/register', registerRules, validate, ctrl.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: admin@finance.com }
 *               password: { type: string, example: Admin@1234 }
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginRules, validate, ctrl.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
