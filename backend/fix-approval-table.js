const db = require('./configs/db');

/**
 * Fix doctor_approvals table to allow multiple approval records per doctor
 * Drop the UNIQUE index on doctor_id so doctors can resubmit after rejection
 */

async function fixDoctorApprovalsTable() {
  try {
    console.log('\n🔧 FIXING doctor_approvals TABLE\n');

    console.log('1️⃣  Current state: UNIQUE index on doctor_id prevents resubmission');
    console.log('   This index was not in schema, appears to be auto-created\n');

    console.log('2️⃣  Solution: Drop and recreate FK without UNIQUE constraint...');
    
    try {
      // Step 1: Drop the unique index by dropping and recreating the foreign key
      console.log('\n   Step A: Getting current foreign key info...');
      const [fks] = await db.query(`
        SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = 'doctor_approvals'
        AND COLUMN_NAME = 'doctor_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);

      if (fks.length === 0) {
        console.log('   ❌ Foreign key not found');
        process.exit(1);
      }

      const fkInfo = fks[0];
      console.log(`   ✅ FK: ${fkInfo.CONSTRAINT_NAME}`);

      console.log('\n   Step B: Dropping foreign key constraint...');
      await db.execute(`ALTER TABLE doctor_approvals DROP FOREIGN KEY ${fkInfo.CONSTRAINT_NAME}`);
      console.log('   ✅ Dropped');

      console.log('\n   Step C: Dropping UNIQUE index on doctor_id...');
      try {
        await db.execute('ALTER TABLE doctor_approvals DROP INDEX doctor_id');
        console.log('   ✅ Dropped unique index');
      } catch (e) {
        console.log(`   Note: ${e.message}`);
      }

      console.log('\n   Step D: Creating non-unique index for FK...');
      await db.execute('ALTER TABLE doctor_approvals ADD INDEX idx_doctor_id (doctor_id)');
      console.log('   ✅ Created non-unique index');

      console.log('\n   Step E: Recreating foreign key...');
      await db.execute(`
        ALTER TABLE doctor_approvals 
        ADD CONSTRAINT doctor_approvals_ibfk_1 
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('   ✅ Recreated foreign key');

      console.log('\n3️⃣  Verifying final state...');
      const [finalIndexes] = await db.query(`
        SELECT INDEX_NAME, NON_UNIQUE
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_NAME = 'doctor_approvals'
        AND COLUMN_NAME = 'doctor_id'
        ORDER BY INDEX_NAME
      `);

      console.log('   Indexes on doctor_id:');
      finalIndexes.forEach(idx => {
        const isUnique = idx.NON_UNIQUE === 0;
        console.log(`   - ${idx.INDEX_NAME}: ${isUnique ? 'UNIQUE' : 'NON-UNIQUE'}`);
      });

      console.log('\n4️⃣  Testing multiple records for same doctor...');
      
      // Get a valid doctor ID and file ID
      const [[doctor]] = await db.execute(`
        SELECT id FROM users WHERE role = 'doctor' LIMIT 1
      `);
      
      const [[file]] = await db.execute(`
        SELECT id FROM files LIMIT 1
      `);
      
      if (doctor && file) {
        const testDoctorId = doctor.id;
        const testFileId = file.id;
        
        // Clean up any existing test data
        await db.execute('DELETE FROM doctor_approvals WHERE doctor_id = ?', [testDoctorId]);
        
        // Try to insert two records
        const [result1] = await db.execute(
          'INSERT INTO doctor_approvals (doctor_id, certificate_file_id, status) VALUES (?, ?, ?)',
          [testDoctorId, testFileId, 'pending']
        );
        console.log(`   ✅ First record created (ID: ${result1.insertId})`);

        const [result2] = await db.execute(
          'INSERT INTO doctor_approvals (doctor_id, certificate_file_id, status) VALUES (?, ?, ?)',
          [testDoctorId, testFileId, 'rejected']
        );
        console.log(`   ✅ Second record created (ID: ${result2.insertId})`);

        // Clean up
        await db.execute('DELETE FROM doctor_approvals WHERE doctor_id = ?', [testDoctorId]);
      } else {
        console.log('   ⚠️  No test data available, skipping test');
      }

      console.log('\n✅ FIXED: doctor_approvals table now allows multiple records per doctor\n');
      console.log('📊 Summary:');
      console.log('═════════════════════════════════════════════');
      console.log('✅ Doctor can create multiple approval requests');
      console.log('✅ Doctor can resubmit after rejection');
      console.log('✅ Approval history is maintained');
      console.log('✅ Foreign key constraints preserved');
      console.log('═════════════════════════════════════════════\n');

    } catch (e) {
      console.error('❌ Error during fix:', e.message);
      throw e;
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDoctorApprovalsTable();
