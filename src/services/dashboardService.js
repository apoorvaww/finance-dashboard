const { query } = require('../config/db');

// Scope helper: admins see all, others see only their own
const userScope = (role, userId, params) => {
  if (role === 'admin') return '';
  params.push(userId);
  return `AND user_id = $${params.length}`;
};

// ── Overview: total income, expenses, net balance ────────────────────────────
const getSummary = async (user) => {
  const params = [];
  const scope  = userScope(user.role, user.id, params);

  const { rows } = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expenses,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                         WHEN type = 'expense' THEN -amount END), 0) AS net_balance,
       COUNT(*)                                                       AS total_records
     FROM financial_records
     WHERE deleted_at IS NULL ${scope}`,
    params
  );
  return rows[0];
};

// ── Category-wise totals ─────────────────────────────────────────────────────
const getCategoryTotals = async (user, type) => {
  const params = [];
  const scope  = userScope(user.role, user.id, params);

  let typeFilter = '';
  if (type) {
    params.push(type);
    typeFilter = `AND type = $${params.length}`;
  }

  const { rows } = await query(
    `SELECT category, type,
            SUM(amount)  AS total,
            COUNT(*)     AS count
     FROM financial_records
     WHERE deleted_at IS NULL ${scope} ${typeFilter}
     GROUP BY category, type
     ORDER BY total DESC`,
    params
  );
  return rows;
};

// ── Monthly trends (last N months) ──────────────────────────────────────────
const getMonthlyTrends = async (user, months = 6) => {
  const params = [months];
  const scope  = userScope(user.role, user.id, params);

  const { rows } = await query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', record_date), 'YYYY-MM') AS month,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expenses,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                         WHEN type = 'expense' THEN -amount END), 0) AS net
     FROM financial_records
     WHERE deleted_at IS NULL
       AND record_date >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' * ($1 - 1)
       ${scope}
     GROUP BY DATE_TRUNC('month', record_date)
     ORDER BY DATE_TRUNC('month', record_date) ASC`,
    params
  );
  return rows;
};

// ── Weekly trends (last N weeks) ─────────────────────────────────────────────
const getWeeklyTrends = async (user, weeks = 8) => {
  const params = [weeks];
  const scope  = userScope(user.role, user.id, params);

  const { rows } = await query(
    `SELECT
       TO_CHAR(DATE_TRUNC('week', record_date), 'YYYY-MM-DD') AS week_start,
       COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expenses
     FROM financial_records
     WHERE deleted_at IS NULL
       AND record_date >= DATE_TRUNC('week', NOW()) - INTERVAL '1 week' * ($1 - 1)
       ${scope}
     GROUP BY DATE_TRUNC('week', record_date)
     ORDER BY DATE_TRUNC('week', record_date) ASC`,
    params
  );
  return rows;
};

// ── Recent activity (last N records) ─────────────────────────────────────────
const getRecentActivity = async (user, limit = 10) => {
  const params = [limit];
  const scope  = userScope(user.role, user.id, params);

  const { rows } = await query(
    `SELECT r.id, r.amount, r.type, r.category, r.record_date, r.notes,
            u.name AS created_by
     FROM financial_records r
     JOIN users u ON r.user_id = u.id
     WHERE r.deleted_at IS NULL ${scope}
     ORDER BY r.created_at DESC
     LIMIT $1`,
    params
  );
  return rows;
};

// ── Top categories by spend (analyst+) ───────────────────────────────────────
const getTopCategories = async (user, limit = 5) => {
  const params = [limit];
  const scope  = userScope(user.role, user.id, params);

  const { rows } = await query(
    `SELECT category,
            SUM(amount)  AS total_spent,
            COUNT(*)     AS transaction_count,
            ROUND(100.0 * SUM(amount) /
              SUM(SUM(amount)) OVER (), 2) AS percentage
     FROM financial_records
     WHERE deleted_at IS NULL AND type = 'expense' ${scope}
     GROUP BY category
     ORDER BY total_spent DESC
     LIMIT $1`,
    params
  );
  return rows;
};

module.exports = {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getTopCategories,
};
