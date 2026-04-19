const mysql = require("mysql2/promise");
require("dotenv").config();

// Create pool immediately
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.on('connection', () => {
  console.log('📊 New database connection created');
});

pool.on('error', (err) => {
  console.error('❌ Pool error:', err.message);
});

console.log("✅ MySQL promise pool created");

// Create wrapper object with all necessary methods
const db = {
  // Direct pool query method
  execute: async (sql, values) => {
    try {
      console.log('🔍 Executing query:', sql.substring(0, 50) + '...');
      return await pool.execute(sql, values);
    } catch (error) {
      console.error('❌ Execute error:', error.message);
      throw error;
    }
  },

  // Get connection for transactions
  getConnection: async () => {
    try {
      console.log('🔌 Getting connection from pool...');
      const connection = await pool.getConnection();
      console.log('✅ Connection acquired');
      return connection;
    } catch (error) {
      console.error('❌ Error getting connection:', error.message);
      throw error;
    }
  },

  // Expose pool directly for special cases
  pool: pool
};

// Verify export
console.log('✅ DB wrapper object created with methods:', Object.keys(db));
console.log('✅ typeof db.getConnection:', typeof db.getConnection);
console.log('✅ typeof db.execute:', typeof db.execute);

module.exports = db;