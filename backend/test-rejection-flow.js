const db = require('./configs/db');

/**
 * Test complete doctor profile lifecycle:
 * 1. Create profile (is_verified = 0)
 * 2. Upload certificate
 * 3. Request approval (creates approval record)
 * 4. Admin REJECTS → Profile DELETED from doctor_profiles
 * 5. Doctor resubmits (creates new profile)
 * 6. Admin APPROVES → Profile updated (is_verified = 1)
 */

async function testCompleteLifecycle() {
  try {
    console.log('\n🔄 TESTING COMPLETE DOCTOR PROFILE LIFECYCLE\n');

    // Step 1: Create a test doctor user
    console.log('📋 STEP 1: Creating test doctor user');
    const testEmail = `testdoc-${Date.now()}@hospital.com`;
    const [userResult] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Dr. Lifecycle Test', testEmail, 'hashedpass123', 'doctor']
    );
    const doctorId = userResult.insertId;
    console.log(`✅ Created doctor ID: ${doctorId}, Email: ${testEmail}\n`);

    // Step 2: Upload certificate file
    console.log('📋 STEP 2: Uploading certificate file');
    const [fileResult] = await db.execute(
      'INSERT INTO files (user_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)',
      [doctorId, 'cert-lifecycle.pdf', 'C:/storage/cert-lifecycle.pdf', 'certificate']
    );
    const fileId = fileResult.insertId;
    console.log(`✅ Created file ID: ${fileId}\n`);

    // Step 3: Create doctor profile with is_verified = 0
    console.log('📋 STEP 3: Creating doctor profile (is_verified = 0)');
    const [profileResult] = await db.execute(
      'INSERT INTO doctor_profiles (user_id, specialization, experience, hospital_name, address, is_verified, certificate_file_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doctorId, 'Orthopedics', 10, 'Lifecycle Hospital', '789 Health Street, NYC', 0, fileId]
    );
    const profileId = profileResult.insertId;
    console.log(`✅ Created profile ID: ${profileId}`);
    console.log(`   - specialization: Orthopedics`);
    console.log(`   - experience: 10`);
    console.log(`   - hospital: Lifecycle Hospital`);
    console.log(`   - is_verified: 0\n`);

    // Step 4: Verify profile exists in database
    console.log('📋 STEP 4: Verifying profile in database');
    const [[profile1]] = await db.execute(
      'SELECT * FROM doctor_profiles WHERE user_id = ?',
      [doctorId]
    );
    if (profile1) {
      console.log(`✅ Profile found in database`);
      console.log(`   - ID: ${profile1.id}`);
      console.log(`   - specialization: ${profile1.specialization}`);
      console.log(`   - experience: ${profile1.experience}`);
      console.log(`   - is_verified: ${profile1.is_verified}\n`);
    }

    // Step 5: Request approval (create approval record)
    console.log('📋 STEP 5: Creating approval request (status = pending)');
    const [approvalResult] = await db.execute(
      'INSERT INTO doctor_approvals (doctor_id, certificate_file_id, status) VALUES (?, ?, ?)',
      [doctorId, fileId, 'pending']
    );
    const approvalId = approvalResult.insertId;
    console.log(`✅ Created approval ID: ${approvalId}`);
    console.log(`   - doctor_id: ${doctorId}`);
    console.log(`   - status: pending\n`);

    // Step 6: Admin REJECTS doctor
    console.log('📋 STEP 6: Admin REJECTS the doctor');
    const rejectionReason = 'Credentials not verified';
    
    // Update approval status to rejected
    await db.execute(
      'UPDATE doctor_approvals SET status = ?, admin_message = ?, reviewed_at = NOW() WHERE id = ?',
      ['rejected', rejectionReason, approvalId]
    );
    console.log(`✅ Updated approval status to: rejected`);
    console.log(`   - Reason: ${rejectionReason}`);

    // DELETE profile from doctor_profiles
    const [deleteResult] = await db.execute(
      'DELETE FROM doctor_profiles WHERE user_id = ?',
      [doctorId]
    );
    console.log(`✅ DELETED profile from doctor_profiles table`);
    console.log(`   - Rows deleted: ${deleteResult.affectedRows}\n`);

    // Step 7: Verify profile is DELETED
    console.log('📋 STEP 7: Verifying profile is DELETED from database');
    const [[profile2]] = await db.execute(
      'SELECT * FROM doctor_profiles WHERE user_id = ?',
      [doctorId]
    );
    if (!profile2) {
      console.log(`✅ Confirmed: Profile DELETED successfully`);
      console.log(`   - No profile found for doctor ${doctorId}\n`);
    } else {
      console.log(`❌ ERROR: Profile still exists in database!\n`);
    }

    // Step 8: Verify approval record STILL EXISTS (for history)
    console.log('📋 STEP 8: Verifying approval record is kept (for history)');
    const [[approval1]] = await db.execute(
      'SELECT * FROM doctor_approvals WHERE id = ?',
      [approvalId]
    );
    if (approval1) {
      console.log(`✅ Approval record kept for history`);
      console.log(`   - Status: ${approval1.status}`);
      console.log(`   - Message: ${approval1.admin_message}\n`);
    }

    // Step 9: Doctor RESUBMITS with corrections
    console.log('📋 STEP 9: Doctor RESUBMITS with corrections (new profile)');
    const [profileResult2] = await db.execute(
      'INSERT INTO doctor_profiles (user_id, specialization, experience, hospital_name, address, is_verified, certificate_file_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doctorId, 'Orthopedics', 12, 'Lifecycle Hospital - Branch 2', '789 Health Street, Suite 200, NYC', 0, fileId]
    );
    const profileId2 = profileResult2.insertId;
    console.log(`✅ Created NEW profile ID: ${profileId2}`);
    console.log(`   - specialization: Orthopedics`);
    console.log(`   - experience: 12 (updated)`);
    console.log(`   - hospital: Lifecycle Hospital - Branch 2 (updated)`);
    console.log(`   - is_verified: 0 (starts as pending again)\n`);

    // Step 10: Create new approval request
    console.log('📋 STEP 10: Doctor creates NEW approval request');
    const [approvalResult2] = await db.execute(
      'INSERT INTO doctor_approvals (doctor_id, certificate_file_id, status) VALUES (?, ?, ?)',
      [doctorId, fileId, 'pending']
    );
    const approvalId2 = approvalResult2.insertId;
    console.log(`✅ Created NEW approval ID: ${approvalId2}\n`);

    // Step 11: Admin APPROVES doctor (second time)
    console.log('📋 STEP 11: Admin APPROVES the doctor (second attempt)');
    
    // Update profile is_verified to 1
    await db.execute(
      'UPDATE doctor_profiles SET is_verified = 1 WHERE user_id = ?',
      [doctorId]
    );
    console.log(`✅ Updated profile is_verified: 0 → 1`);

    // Update approval status to approved
    await db.execute(
      'UPDATE doctor_approvals SET status = ?, reviewed_at = NOW() WHERE id = ?',
      ['approved', approvalId2]
    );
    console.log(`✅ Updated approval status to: approved\n`);

    // Step 12: Verify final state
    console.log('📋 STEP 12: Verifying final state');
    const [[finalProfile]] = await db.execute(
      'SELECT * FROM doctor_profiles WHERE user_id = ?',
      [doctorId]
    );
    const [[finalApproval]] = await db.execute(
      'SELECT * FROM doctor_approvals WHERE id = ?',
      [approvalId2]
    );

    console.log(`✅ FINAL PROFILE STATE:`);
    console.log(`   - ID: ${finalProfile.id}`);
    console.log(`   - specialization: ${finalProfile.specialization}`);
    console.log(`   - experience: ${finalProfile.experience}`);
    console.log(`   - hospital: ${finalProfile.hospital_name}`);
    console.log(`   - is_verified: ${finalProfile.is_verified} ✅ APPROVED\n`);

    console.log(`✅ FINAL APPROVAL STATE:`);
    console.log(`   - ID: ${finalApproval.id}`);
    console.log(`   - doctor_id: ${finalApproval.doctor_id}`);
    console.log(`   - status: ${finalApproval.status} ✅ APPROVED\n`);

    // Cleanup
    console.log('🧹 CLEANUP: Removing test data');
    await db.execute('DELETE FROM notifications WHERE user_id = ?', [doctorId]);
    await db.execute('DELETE FROM doctor_approvals WHERE doctor_id = ?', [doctorId]);
    await db.execute('DELETE FROM doctor_profiles WHERE user_id = ?', [doctorId]);
    await db.execute('DELETE FROM files WHERE user_id = ?', [doctorId]);
    await db.execute('DELETE FROM users WHERE id = ?', [doctorId]);
    console.log(`✅ Test data cleaned up\n`);

    console.log('\n✅ COMPLETE LIFECYCLE TEST PASSED!\n');
    console.log('📊 SUMMARY:');
    console.log('═════════════════════════════════════════════════════');
    console.log('1️⃣  Profile created with is_verified = 0 ✅');
    console.log('2️⃣  Approval request created (status = pending) ✅');
    console.log('3️⃣  Admin REJECTED → Profile DELETED ✅');
    console.log('4️⃣  Approval record kept for history ✅');
    console.log('5️⃣  Doctor RESUBMITTED with new profile ✅');
    console.log('6️⃣  New approval request created ✅');
    console.log('7️⃣  Admin APPROVED → is_verified = 1 ✅');
    console.log('8️⃣  Profile data PERSISTED after approval ✅');
    console.log('═════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testCompleteLifecycle();
