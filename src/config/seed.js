require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminPassword = await bcrypt.hash('Admin@1234', 12);
    const analystPassword = await bcrypt.hash('Analyst@1234', 12);
    const viewerPassword = await bcrypt.hash('Viewer@1234', 12);

    // Insert seed users
    const { rows: users } = await client.query(`
      INSERT INTO users (name, email, password, role, status) VALUES
        ('Super Admin',   'admin@finance.com',   $1, 'admin',   'active'),
        ('Jane Analyst',  'analyst@finance.com', $2, 'analyst', 'active'),
        ('Bob Viewer',    'viewer@finance.com',  $3, 'viewer',  'active')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role;
    `, [adminPassword, analystPassword, viewerPassword]);

    if (users.length === 0) {
      console.log('⚠️  Seed users already exist, skipping records.');
      await client.query('COMMIT');
      return;
    }

    const adminId = users.find(u => u.role === 'admin').id;

    // Insert sample financial records
    const records = [
      [adminId, 5000.00,  'income',  'Salary',        '2024-01-05', 'Monthly salary'],
      [adminId, 1200.00,  'expense', 'Rent',           '2024-01-10', 'Jan rent'],
      [adminId, 250.50,   'expense', 'Groceries',      '2024-01-15', 'Weekly groceries'],
      [adminId, 800.00,   'income',  'Freelance',      '2024-01-20', 'Web project payment'],
      [adminId, 99.99,    'expense', 'Subscriptions',  '2024-01-25', 'SaaS tools'],
      [adminId, 5000.00,  'income',  'Salary',         '2024-02-05', 'Monthly salary'],
      [adminId, 1200.00,  'expense', 'Rent',           '2024-02-10', 'Feb rent'],
      [adminId, 300.00,   'expense', 'Utilities',      '2024-02-12', 'Electricity & water'],
      [adminId, 1500.00,  'income',  'Freelance',      '2024-02-18', 'Mobile app project'],
      [adminId, 450.00,   'expense', 'Entertainment',  '2024-02-22', 'Dining & movies'],
    ];

    for (const r of records) {
      await client.query(
        `INSERT INTO financial_records (user_id, amount, type, category, record_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        r
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully');
    console.log('\n📋 Test credentials:');
    console.log('   Admin:   admin@finance.com   / Admin@1234');
    console.log('   Analyst: analyst@finance.com / Analyst@1234');
    console.log('   Viewer:  viewer@finance.com  / Viewer@1234');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(() => process.exit(1));
