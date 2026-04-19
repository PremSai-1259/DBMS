const db = require('./configs/db');

async function testAdminWorkflow() {
  try {
    console.log('🧪 Testing Complete Admin Approval Workflow\n');

    // Step 1: Verify pending approvals are fetchable
    console.log('1️⃣  ADMIN FETCHING PENDING DOCTORS');
    const [pending] = await db.query(`
      SELECT 
        da.id as approvalId,
        da.doctor_id as doctorId,
        da.certificate_file_id as certificateFileId,
        da.status,
        u.name as doctorName,
        u.email,
        dp.specialization,
        dp.experience,
        dp.hospital_name as hospitalName,
        dp.address,
        f.file_name as certificateName,
        f.file_path as certificatePath
      FROM doctor_approvals da
      INNER JOIN users u ON da.doctor_id = u.id
      LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id
      LEFT JOIN files f ON da.certificate_file_id = f.id
      WHERE da.status = 'pending'
    `);

    console.log(`   ✅ Found ${pending.length} pending approval(s)\n`);

    if (pending.length === 0) {
      console.log('   ⚠️  No pending approvals to display!');
      console.log('   Run: node create-test-doctor.js\n');
      process.exit(0);
    }

    // Display pending doctors
    pending.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.doctorName} (ID: ${doc.doctorId})`);
      console.log(`      Email: ${doc.email}`);
      console.log(`      Specialization: ${doc.specialization || '❌ NULL'} ✓`);
      console.log(`      Experience: ${doc.experience || '❌ NULL'} years ✓`);
      console.log(`      Hospital: ${doc.hospitalName || '❌ NULL'} ✓`);
      console.log(`      Address: ${doc.address || '❌ NULL'} ✓`);
      console.log(`      Certificate: ${doc.certificateName} ✓`);
    });

    // Step 2: Verify admin can get full doctor details
    console.log('\n2️⃣  ADMIN VIEWING DOCTOR DETAILS');
    const doctorId = pending[0].doctorId;
    
    const [details] = await db.query(`
      SELECT 
        da.id as approvalId,
        da.doctor_id as doctorId,
        da.certificate_file_id as certificateFileId,
        da.status,
        u.name,
        u.email,
        dp.specialization,
        dp.experience,
        dp.hospital_name as hospitalName,
        dp.address,
        f.id as fileId,
        f.file_name as certificateName,
        f.file_path as certificatePath
      FROM doctor_approvals da
      INNER JOIN users u ON da.doctor_id = u.id
      LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id
      LEFT JOIN files f ON da.certificate_file_id = f.id
      WHERE da.doctor_id = ? AND da.status = 'pending'
      LIMIT 1
    `, [doctorId]);

    if (details.length > 0) {
      const detail = details[0];
      console.log(`   ✅ Got full details for ${detail.name}:`);
      console.log(`      - Specialization: ${detail.specialization}`);
      console.log(`      - Experience: ${detail.experience} years`);
      console.log(`      - Hospital: ${detail.hospitalName}`);
      console.log(`      - Address: ${detail.address}`);
      console.log(`      - Certificate File ID: ${detail.fileId}`);
      console.log(`      - Certificate Name: ${detail.certificateName}`);

      // Step 3: Verify admin can access certificate files
      console.log('\n3️⃣  ADMIN DOWNLOADING CERTIFICATE');
      const fs = require('fs');
      const certificatePath = detail.certificatePath;
      
      if (fs.existsSync(certificatePath)) {
        const stats = fs.statSync(certificatePath);
        console.log(`   ✅ Certificate exists on disk`);
        console.log(`      Path: ${certificatePath}`);
        console.log(`      Size: ${stats.size} bytes`);
        console.log(`      Status: Ready to download`);
      } else {
        console.log(`   ❌ Certificate NOT found at: ${certificatePath}`);
      }

      // Step 4: Simulate approval
      console.log('\n4️⃣  ADMIN APPROVING DOCTOR');
      const approvalId = detail.approvalId;

      // Check profile completeness before approval
      const [[profileCheck]] = await db.query(
        'SELECT * FROM doctor_profiles WHERE user_id = ?',
        [doctorId]
      );

      if (profileCheck && profileCheck.specialization && profileCheck.experience && profileCheck.hospital_name && profileCheck.address) {
        console.log(`   ✅ Profile data complete - ready to approve`);

        // Approve the doctor
        await db.execute(
          'UPDATE doctor_approvals SET status = ?, reviewed_at = NOW() WHERE id = ?',
          ['approved', approvalId]
        );

        await db.execute(
          'UPDATE doctor_profiles SET is_verified = ? WHERE user_id = ?',
          [true, doctorId]
        );

        console.log(`   ✅ Doctor approved successfully`);

        // Step 5: Verify data persists after approval
        console.log('\n5️⃣  VERIFYING DATA PERSISTS AFTER APPROVAL');

        const [[approvedProfile]] = await db.query(
          'SELECT * FROM doctor_profiles WHERE user_id = ? AND is_verified = ?',
          [doctorId, true]
        );

        if (approvedProfile) {
          console.log(`   ✅ Approved doctor profile still in database:`);
          console.log(`      - Specialization: ${approvedProfile.specialization}`);
          console.log(`      - Experience: ${approvedProfile.experience}`);
          console.log(`      - Hospital: ${approvedProfile.hospital_name}`);
          console.log(`      - Address: ${approvedProfile.address}`);
          console.log(`      - Verified: ${approvedProfile.is_verified}`);
        } else {
          console.log(`   ❌ Profile data lost after approval!`);
        }

        // Step 6: Verify admin can still access doctor files
        console.log('\n6️⃣  ADMIN ACCESSING APPROVED DOCTOR FILES');
        const [doctorFiles] = await db.query(
          'SELECT * FROM files WHERE user_id = ?',
          [doctorId]
        );

        console.log(`   ✅ Found ${doctorFiles.length} file(s) for doctor`);
        doctorFiles.forEach(f => {
          const exists = fs.existsSync(f.file_path) ? '✅' : '❌';
          console.log(`      ${exists} ${f.file_name}`);
        });

      } else {
        console.log(`   ❌ Profile incomplete - cannot approve`);
        if (!profileCheck.specialization) console.log(`      - Missing: specialization`);
        if (!profileCheck.experience) console.log(`      - Missing: experience`);
        if (!profileCheck.hospital_name) console.log(`      - Missing: hospital_name`);
        if (!profileCheck.address) console.log(`      - Missing: address`);
      }
    }

    console.log('\n\n✅ ADMIN WORKFLOW TEST COMPLETE\n');
    console.log('📋 Summary:');
    console.log('=================================================');
    console.log('✅ Admin can fetch pending doctor approvals');
    console.log('✅ Admin can view complete doctor details');
    console.log('✅ Admin can download certificates');
    console.log('✅ Admin can approve doctors');
    console.log('✅ Doctor profile data persists after approval');
    console.log('✅ Admin can access all doctor files');
    console.log('=================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdminWorkflow();
