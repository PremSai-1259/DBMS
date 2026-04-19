const mysql = require('mysql2/promise');

/**
 * FIX NULL PROFILES AND ADD CONSTRAINTS
 * 
 * This script:
 * 1. Identifies all profiles with NULL values
 * 2. Deletes these invalid profiles
 * 3. Adds NOT NULL constraints to prevent future NULL values
 * 4. Verifies the fix
 */

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'shivA@123',
  database: 'demo2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function main() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Connected to database\n');

    // Step 1: Find all profiles with NULL values
    console.log('📋 STEP 1: Finding profiles with NULL values...');
    const [nullProfiles] = await connection.execute(`
      SELECT id, user_id, specialization, experience, hospital_name, address, is_verified
      FROM doctor_profiles
      WHERE specialization IS NULL 
         OR experience IS NULL 
         OR hospital_name IS NULL 
         OR address IS NULL
      ORDER BY id
    `);

    console.log(`Found ${nullProfiles.length} profiles with NULL values:\n`);
    nullProfiles.forEach(p => {
      console.log(`  ID: ${p.id}, User: ${p.user_id}, Verified: ${p.is_verified}`);
      console.log(`    - Specialization: ${p.specialization}`);
      console.log(`    - Experience: ${p.experience}`);
      console.log(`    - Hospital: ${p.hospital_name}`);
      console.log(`    - Address: ${p.address}\n`);
    });

    if (nullProfiles.length === 0) {
      console.log('✅ No NULL profiles found! Database is clean.\n');
    } else {
      // Step 2: Delete NULL profiles
      console.log('🗑️  STEP 2: Deleting NULL profiles...');
      const profileIds = nullProfiles.map(p => p.id);
      const placeholders = profileIds.map(() => '?').join(',');
      
      const [deleteResult] = await connection.execute(
        `DELETE FROM doctor_profiles WHERE id IN (${placeholders})`,
        profileIds
      );
      console.log(`✅ Deleted ${deleteResult.affectedRows} NULL profiles\n`);
    }

    // Step 3: Add NOT NULL constraints
    console.log('🔒 STEP 3: Adding NOT NULL constraints to prevent future NULL values...');
    
    try {
      await connection.execute(`
        ALTER TABLE doctor_profiles
        MODIFY COLUMN specialization VARCHAR(100) NOT NULL
      `);
      console.log('  ✅ specialization: NOT NULL constraint added');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  specialization: constraint already exists');
      } else {
        throw e;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE doctor_profiles
        MODIFY COLUMN experience INT NOT NULL
      `);
      console.log('  ✅ experience: NOT NULL constraint added');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  experience: constraint already exists');
      } else {
        throw e;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE doctor_profiles
        MODIFY COLUMN hospital_name VARCHAR(150) NOT NULL
      `);
      console.log('  ✅ hospital_name: NOT NULL constraint added');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  hospital_name: constraint already exists');
      } else {
        throw e;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE doctor_profiles
        MODIFY COLUMN address VARCHAR(255) NOT NULL
      `);
      console.log('  ✅ address: NOT NULL constraint added\n');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  address: constraint already exists\n');
      } else {
        throw e;
      }
    }

    // Step 4: Add CHECK constraints for valid ranges
    console.log('📊 STEP 4: Adding CHECK constraints for valid data ranges...');
    
    try {
      await connection.execute(`
        ALTER TABLE doctor_profiles
        ADD CONSTRAINT chk_experience_range CHECK (experience >= 0 AND experience <= 70)
      `);
      console.log('  ✅ experience range check (0-70) added');
    } catch (e) {
      if (e.code === 1064 || e.code === 'ER_PARSE_ERROR' || e.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  experience range check already exists or not supported');
      } else {
        console.log(`  ℹ️  experience range check: ${e.code}`);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE doctor_profiles
        ADD CONSTRAINT chk_specialization_length CHECK (LENGTH(specialization) >= 3)
      `);
      console.log('  ✅ specialization min length check (3 chars) added');
    } catch (e) {
      if (e.code === 1064 || e.code === 'ER_PARSE_ERROR' || e.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  specialization length check already exists or not supported');
      } else {
        console.log(`  ℹ️  specialization length check: ${e.code}`);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE doctor_profiles
        ADD CONSTRAINT chk_address_length CHECK (LENGTH(address) >= 10)
      `);
      console.log('  ✅ address min length check (10 chars) added\n');
    } catch (e) {
      if (e.code === 1064 || e.code === 'ER_PARSE_ERROR' || e.code === 'ER_DUP_KEYNAME') {
        console.log('  ℹ️  address length check already exists or not supported\n');
      } else {
        console.log(`  ℹ️  address length check: ${e.code}\n`);
      }
    }

    // Step 5: Verify fix
    console.log('✅ STEP 5: Verifying fix...');
    const [allProfiles] = await connection.execute(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN specialization IS NULL THEN 1 ELSE 0 END) as null_spec,
             SUM(CASE WHEN experience IS NULL THEN 1 ELSE 0 END) as null_exp,
             SUM(CASE WHEN hospital_name IS NULL THEN 1 ELSE 0 END) as null_hosp,
             SUM(CASE WHEN address IS NULL THEN 1 ELSE 0 END) as null_addr
      FROM doctor_profiles
    `);

    console.log(`
📊 VERIFICATION RESULTS:
  Total profiles: ${allProfiles[0].total}
  NULL specialization: ${allProfiles[0].null_spec || 0}
  NULL experience: ${allProfiles[0].null_exp || 0}
  NULL hospital_name: ${allProfiles[0].null_hosp || 0}
  NULL address: ${allProfiles[0].null_addr || 0}
    `);

    const [cleanProfiles] = await connection.execute(`
      SELECT id, user_id, specialization, experience, hospital_name, address, is_verified
      FROM doctor_profiles
      ORDER BY id
    `);

    if (cleanProfiles.length > 0) {
      console.log('✅ Clean profiles remaining:');
      cleanProfiles.forEach(p => {
        console.log(`  ID ${p.id}: User ${p.user_id} - ${p.specialization} (${p.experience} yrs) at ${p.hospital_name} - Verified: ${p.is_verified}`);
      });
    } else {
      console.log('ℹ️  No profiles in database');
    }

    console.log('\n✅ FIX COMPLETE! NULL profiles removed and constraints added.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main();
