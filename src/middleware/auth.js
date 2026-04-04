const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// ── Authenticate JWT ─────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data (catches deactivated users mid-session)
    const { rows } = await query(
      'SELECT id, name, email, role, status FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (rows[0].status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is inactive.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ── Role Guard factory ───────────────────────────────────────────────────────
// Usage: authorize('admin') or authorize('admin', 'analyst')
const ROLE_HIERARCHY = { viewer: 1, analyst: 2, admin: 3 };

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const hasAccess = allowedRoles.some(
      (role) => ROLE_HIERARCHY[req.user.role] >= ROLE_HIERARCHY[role]
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
};

// Shorthand guards
const isAdmin   = authorize('admin');
const isAnalyst = authorize('analyst');  // analyst OR admin
const isViewer  = authorize('viewer');   // any authenticated user

module.exports = { authenticate, authorize, isAdmin, isAnalyst, isViewer };
