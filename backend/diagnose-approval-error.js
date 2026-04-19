const mysql = require('mysql2/promise');

/**
 * DIAGNOSE APPROVAL REQUEST ERROR
 * 
 * Checks:
 * 1. Doctor profile status (User 31)
 * 2. Existing approval records for User 31
 * 3. Certificate file exists (ID 26)
 * 4. Database constraints
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

    const doctorId = 31;
    const certificateFileId = 26;

    // Step 1: Check doctor profile
    console.log(`📋 STEP 1: Checking doctor profile for User ${doctorId}...`);
    const [profiles] = await connection.execute(`
      SELECT * FROM doctor_profiles WHERE user_id = ?
    `, [doctorId]);

    if (profiles.length === 0) {
      console.log(`  ❌ NO PROFILE FOUND for user ${doctorId}`);
    } else {
      const p = profiles[0];
      console.log(`  ✅ Profile found (ID: ${p.id})`);
      console.log(`     - Specialization: ${p.specialization}`);
      console.log(`     - Experience: ${p.experience}`);
      console.log(`     - Hospital: ${p.hospital_name}`);
      console.log(`     - Address: ${p.address}`);
      console.log(`     - Is Verified: ${p.is_verified}`);
      console.log(`     - Certificate File ID: ${p.certificate_file_id}\n`);
    }

    // Step 2: Check approval status
    console.log(`📋 STEP 2: Checking approval records for User ${doctorId}...`);
    const [approvals] = await connection.execute(`
      SELECT id, status, submitted_at, admin_message 
      FROM doctor_approvals 
      WHERE doctor_id = ?
      ORDER BY id DESC
    `, [doctorId]);

    console.log(`  Found ${approvals.length} approval record(s):`);
    approvals.forEach((a, i) => {
      console.log(`  ${i + 1}. ID: ${a.id}, Status: ${a.status}, Submitted: ${a.submitted_at}`);
      if (a.admin_message) {
        console.log(`     Message: ${a.admin_message}`);
      }
    });

    // Check for pending
    const hasPending = approvals.some(a => a.status === 'pending');
    const hasApproved = approvals.some(a => a.status === 'approved');
    
    console.log(`
  📊 Approval Status:
    - Has Pending: ${hasPending ? '⚠️ YES' : '✅ NO'}
    - Has Approved: ${hasApproved ? '✅ YES' : '❌ NO'}\n`);

    // Step 3: Check certificate file
    console.log(`📋 STEP 3: Checking certificate file ID ${certificateFileId}...`);
    const [files] = await connection.execute(`
      SELECT id, user_id, file_name, file_type, uploaded_at 
      FROM files 
      WHERE id = ?
    `, [certificateFileId]);

    if (files.length === 0) {
      console.log(`  ❌ FILE NOT FOUND (ID: ${certificateFileId})`);
    } else {
      const f = files[0];
      console.log(`  ✅ File found: ${f.file_name}`);
      console.log(`     - Type: ${f.file_type}`);
      console.log(`     - Uploaded by User: ${f.user_id}`);
      console.log(`     - Uploaded at: ${f.uploaded_at}\n`);
    }

    // Step 4: Simulate approval request
    console.log(`📋 STEP 4: Simulating approval request...`);
    console.log(`  Checking if can create new approval:`);
    
    if (!profiles.length) {
      console.log(`    ❌ BLOCK: No profile exists`);
    } else if (!profiles[0].specialization || !profiles[0].experience || !profiles[0].hospital_name || !profiles[0].address) {
      console.log(`    ❌ BLOCK: Profile has NULL values`);
    } else if (hasApproved) {
      console.log(`    ❌ BLOCK: Already approved (409)`);
    } else if (hasPending) {
      console.log(`    ❌ BLOCK: Already has pending approval (409)`);
    } else if (!files.length) {
      console.log(`    ❌ BLOCK: Certificate file not found (FK constraint will fail)`);
    } else {
      console.log(`    ✅ PASS: Can create new approval`);
      
      // Try to actually create the approval
      console.log(`\n📋 STEP 5: Attempting to create approval...`);
      try {
        const [result] = await connection.execute(`
          INSERT INTO doctor_approvals 
          (doctor_id, certificate_file_id, status) 
          VALUES (?, ?, 'pending')
        `, [doctorId, certificateFileId]);
        
        console.log(`    ✅ SUCCESS: Approval created with ID: ${result.insertId}`);
        console.log(`    ⚠️  Note: This is a test - in real flow, check for duplicate pending first`);
        
        // Delete the test record
        await connection.execute(`
          DELETE FROM doctor_approvals WHERE id = ?
        `, [result.insertId]);
        console.log(`    🗑️ Test record deleted`);
      } catch (err) {
        console.log(`    ❌ ERROR: ${err.message}`);
        console.log(`    Error code: ${err.code}`);
      }
    }

    console.log(`\n✅ DIAGNOSIS COMPLETE`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main();
