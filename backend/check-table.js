require('dotenv').config();
const db = require('./configs/db');

async function checkTable() {
  try {
    console.log('Checking doctor_approvals table structure...\n');
    const [columns] = await db.execute(`DESCRIBE doctor_approvals`);
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkTable();
