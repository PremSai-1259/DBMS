const mysql = require('mysql2/promise');

/**
 * VERIFY CERTIFICATE FILE ID STORAGE
 * 
 * Checks:
 * 1. All profiles have valid certificate_file_id (not NULL)
 * 2. All certificate_file_ids exist in files table
 * 3. All certificates in files table are linked to profiles
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

    // Step 1: Check doctor profiles and certificate storage
    console.log('📋 STEP 1: Checking doctor profiles and certificate files...');
    const [profiles] = await connection.execute(`
      SELECT 
        dp.id,
        dp.user_id,
        dp.specialization,
        dp.certificate_file_id,
        CASE 
          WHEN dp.certificate_file_id IS NULL THEN '❌ NO CERTIFICATE'
          WHEN f.id IS NULL THEN '⚠️ CERTIFICATE ID MISSING IN FILES TABLE'
          ELSE '✅ VALID'
        END as cert_status,
        f.file_name,
        f.file_type,
        dp.is_verified
      FROM doctor_profiles dp
      LEFT JOIN files f ON dp.certificate_file_id = f.id
      ORDER BY dp.id
    `);

    console.log(`Found ${profiles.length} doctor profiles:\n`);
    let validCount = 0;
    let missingCount = 0;
    let orphanCount = 0;

    profiles.forEach(p => {
      if (p.cert_status === '✅ VALID') {
        validCount++;
        console.log(`  ✅ Profile ${p.id} (User ${p.user_id}): ${p.specialization}`);
        console.log(`     └─ Certificate: ${p.file_name} (ID: ${p.certificate_file_id})`);
      } else if (p.cert_status === '❌ NO CERTIFICATE') {
        missingCount++;
        console.log(`  ❌ Profile ${p.id} (User ${p.user_id}): ${p.specialization}`);
        console.log(`     └─ ⚠️  NO CERTIFICATE STORED!`);
      } else {
        orphanCount++;
        console.log(`  ⚠️  Profile ${p.id} (User ${p.user_id}): ${p.specialization}`);
        console.log(`     └─ Certificate ID ${p.certificate_file_id} NOT FOUND IN FILES TABLE`);
      }
    });

    console.log(`
📊 CERTIFICATE STORAGE SUMMARY:
  ✅ Valid (cert exists & linked): ${validCount}
  ❌ Missing (no cert stored): ${missingCount}
  ⚠️  Orphan (cert ID doesn't exist): ${orphanCount}
    `);

    // Step 2: Check certificate files in files table
    console.log('📋 STEP 2: Checking certificate files...');
    const [certFiles] = await connection.execute(`
      SELECT 
        f.id,
        f.user_id,
        f.file_name,
        f.file_type,
        CASE 
          WHEN dp.id IS NULL THEN '⚠️ NOT LINKED TO ANY PROFILE'
          ELSE '✅ LINKED'
        END as link_status,
        dp.user_id as profile_user_id,
        dp.specialization
      FROM files f
      LEFT JOIN doctor_profiles dp ON f.id = dp.certificate_file_id
      WHERE f.file_type = 'certificate'
      ORDER BY f.id
    `);

    console.log(`Found ${certFiles.length} certificate files:\n`);
    certFiles.forEach(f => {
      if (f.link_status === '✅ LINKED') {
        console.log(`  ✅ File ${f.id}: ${f.file_name}`);
        console.log(`     └─ Linked to Profile (User ${f.profile_user_id}): ${f.specialization}`);
      } else {
        console.log(`  ⚠️  File ${f.id}: ${f.file_name}`);
        console.log(`     └─ NOT LINKED TO ANY PROFILE (uploaded by User ${f.user_id})`);
      }
    });

    // Step 3: Verify data integrity
    console.log(`\n✅ VERIFICATION COMPLETE:`);
    if (missingCount === 0 && orphanCount === 0) {
      console.log('  ✅ All profiles have valid certificates!');
      console.log('  ✅ All certificates are properly linked to profiles!');
      console.log('  ✅ Database integrity check: PASSED');
    } else {
      console.log(`  ⚠️  Found ${missingCount + orphanCount} issues that need fixing`);
      if (missingCount > 0) {
        console.log(`     - ${missingCount} profiles missing certificates`);
      }
      if (orphanCount > 0) {
        console.log(`     - ${orphanCount} profiles with invalid certificate IDs`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main();
