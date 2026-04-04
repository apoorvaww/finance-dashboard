require('dotenv').config();
const { pool } = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // USERS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20) NOT NULL DEFAULT 'viewer'
                      CHECK (role IN ('viewer', 'analyst', 'admin')),
        status      VARCHAR(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ DEFAULT NULL
      );
    `);

    // FINANCIAL RECORDS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_records (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount      NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
        type        VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        category    VARCHAR(100) NOT NULL,
        record_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ DEFAULT NULL
      );
    `);

    // Indexes for common query patterns
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_records_user_id     ON financial_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_records_type        ON financial_records(type);
      CREATE INDEX IF NOT EXISTS idx_records_category    ON financial_records(category);
      CREATE INDEX IF NOT EXISTS idx_records_date        ON financial_records(record_date);
      CREATE INDEX IF NOT EXISTS idx_records_deleted_at  ON financial_records(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role          ON users(role);
    `);

    // Auto-update updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_records_updated_at ON financial_records;
      CREATE TRIGGER update_records_updated_at
        BEFORE UPDATE ON financial_records
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(() => process.exit(1));
