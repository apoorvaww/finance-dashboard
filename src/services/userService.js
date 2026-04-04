const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const getAllUsers = async ({ page = 1, limit = 20, role, status }) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['deleted_at IS NULL'];

  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM users WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT id, name, email, role, status, created_at, updated_at
     FROM users
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rows,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total_pages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (id) => {
  const { rows } = await query(
    'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  if (!rows.length) throw new AppError('User not found.', 404);
  return rows[0];
};

const updateUser = async (id, { name, role, status }) => {
  const user = await getUserById(id);

  const updatedName   = name   ?? user.name;
  const updatedRole   = role   ?? user.role;
  const updatedStatus = status ?? user.status;

  const { rows } = await query(
    `UPDATE users
     SET name = $1, role = $2, status = $3
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING id, name, email, role, status, updated_at`,
    [updatedName, updatedRole, updatedStatus, id]
  );
  return rows[0];
};

const deleteUser = async (id, requestingUserId) => {
  if (parseInt(id, 10) === requestingUserId) {
    throw new AppError('You cannot delete your own account.', 400);
  }
  const { rowCount } = await query(
    'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  if (!rowCount) throw new AppError('User not found.', 404);
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
