const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const VALID_SORT = ['record_date', 'amount', 'created_at', 'category'];

const getRecords = async ({
  page = 1,
  limit = 20,
  type,
  category,
  from_date,
  to_date,
  sort_by = 'record_date',
  sort_order = 'desc',
  user_id,          // if set, filter to this user only (admin fetching one user's records)
  requesting_role,
  requesting_user_id,
}) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['r.deleted_at IS NULL'];

  // Non-admins only see their own records
  const targetUserId = requesting_role === 'admin' && user_id ? user_id : requesting_user_id;
  if (requesting_role !== 'admin') {
    params.push(requesting_user_id);
    conditions.push(`r.user_id = $${params.length}`);
  } else if (user_id) {
    params.push(user_id);
    conditions.push(`r.user_id = $${params.length}`);
  }

  if (type) {
    params.push(type);
    conditions.push(`r.type = $${params.length}`);
  }
  if (category) {
    params.push(`%${category}%`);
    conditions.push(`r.category ILIKE $${params.length}`);
  }
  if (from_date) {
    params.push(from_date);
    conditions.push(`r.record_date >= $${params.length}`);
  }
  if (to_date) {
    params.push(to_date);
    conditions.push(`r.record_date <= $${params.length}`);
  }

  const safeSortBy    = VALID_SORT.includes(sort_by) ? sort_by : 'record_date';
  const safeSortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';
  const where         = conditions.join(' AND ');

  const countRes = await query(`SELECT COUNT(*) FROM financial_records r WHERE ${where}`, params);
  const total    = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const { rows } = await query(
    `SELECT r.id, r.user_id, u.name AS created_by, r.amount, r.type,
            r.category, r.record_date, r.notes, r.created_at, r.updated_at
     FROM financial_records r
     JOIN users u ON r.user_id = u.id
     WHERE ${where}
     ORDER BY r.${safeSortBy} ${safeSortOrder}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rows,
    pagination: {
      total,
      page:        parseInt(page, 10),
      limit:       parseInt(limit, 10),
      total_pages: Math.ceil(total / limit),
    },
  };
};

const getRecordById = async (id, requestingUser) => {
  const { rows } = await query(
    `SELECT r.*, u.name AS created_by
     FROM financial_records r
     JOIN users u ON r.user_id = u.id
     WHERE r.id = $1 AND r.deleted_at IS NULL`,
    [id]
  );
  if (!rows.length) throw new AppError('Record not found.', 404);

  // Non-admins can only view their own records
  if (requestingUser.role !== 'admin' && rows[0].user_id !== requestingUser.id) {
    throw new AppError('Access denied.', 403);
  }
  return rows[0];
};

const createRecord = async ({ user_id, amount, type, category, record_date, notes }) => {
  const { rows } = await query(
    `INSERT INTO financial_records (user_id, amount, type, category, record_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, amount, type, category, record_date || new Date().toISOString().split('T')[0], notes || null]
  );
  return rows[0];
};

const updateRecord = async (id, updates, requestingUser) => {
  const record = await getRecordById(id, requestingUser);

  const amount      = updates.amount      ?? record.amount;
  const type        = updates.type        ?? record.type;
  const category    = updates.category    ?? record.category;
  const record_date = updates.record_date ?? record.record_date;
  const notes       = updates.notes       !== undefined ? updates.notes : record.notes;

  const { rows } = await query(
    `UPDATE financial_records
     SET amount = $1, type = $2, category = $3, record_date = $4, notes = $5
     WHERE id = $6 AND deleted_at IS NULL
     RETURNING *`,
    [amount, type, category, record_date, notes, id]
  );
  return rows[0];
};

const deleteRecord = async (id, requestingUser) => {
  await getRecordById(id, requestingUser); // throws 404 if not found
  const { rowCount } = await query(
    'UPDATE financial_records SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  if (!rowCount) throw new AppError('Record not found.', 404);
};

module.exports = { getRecords, getRecordById, createRecord, updateRecord, deleteRecord };
