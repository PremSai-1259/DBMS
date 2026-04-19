require('dotenv').config();
const db = require('./configs/db');

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to doctor_approvals table...\n');
    
    // Add submitted_at if it doesn't exist
    await db.execute(`
      ALTER TABLE doctor_approvals 
      ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
      AFTER admin_message
    `);
    
    console.log('✅ Column submitted_at added successfully');
    
    // Verify the changes
    const [columns] = await db.execute(`DESCRIBE doctor_approvals`);
    console.log('\nUpdated table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
  } catch (error) {
    if (error.message.includes('Duplicate column')) {
      console.log('ℹ️  Column already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  process.exit(0);
}

addMissingColumns();
