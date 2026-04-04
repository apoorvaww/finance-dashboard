const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async ({ name, email, password, role = 'viewer' }) => {
  // Check duplicate email
  const existing = await query(
    'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  );
  if (existing.rows.length) {
    throw new AppError('Email already registered.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { rows } = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, status, created_at`,
    [name, email, hashedPassword, role]
  );

  const user = rows[0];
  const token = generateToken(user.id);
  return { user, token };
};

const login = async ({ email, password }) => {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  );

  if (!rows.length) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = rows[0];

  if (user.status === 'inactive') {
    throw new AppError('Account is inactive. Contact an administrator.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken(user.id);
  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
};

const getProfile = async (userId) => {
  const { rows } = await query(
    'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  if (!rows.length) throw new AppError('User not found.', 404);
  return rows[0];
};

module.exports = { register, login, getProfile };
