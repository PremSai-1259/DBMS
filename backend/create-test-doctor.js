const db = require('./configs/db');
const { hashPassword } = require('./utils/helpers');
const fs = require('fs');
const path = require('path');

async function createTestDoctorWithApproval() {
  try {
    console.log('📝 Creating Test Doctor with Complete Profile & Pending Approval\n');

    // Step 1: Create test user (doctor)
    console.log('1️⃣  Creating doctor user...');
    const hashedPassword = await hashPassword('password123');
    const [userResult] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Dr. Test Doctor', 'testdoctor@hospital.com', hashedPassword, 'doctor']
    );
    const doctorId = userResult.insertId;
    console.log(`   ✅ Created user ${doctorId}: Dr. Test Doctor\n`);

    // Step 2: Create doctor profile
    console.log('2️⃣  Creating complete doctor profile...');
    const [profileResult] = await db.execute(
      'INSERT INTO doctor_profiles (user_id, specialization, experience, hospital_name, address) VALUES (?, ?, ?, ?, ?)',
      [doctorId, 'Neurology', 8, 'Global Hospital', '456 Medical Complex, NYC 10001']
    );
    const profileId = profileResult.insertId;
    console.log(`   ✅ Created profile ${profileId} with:`);
    console.log(`      - Specialization: Neurology`);
    console.log(`      - Experience: 8 years`);
    console.log(`      - Hospital: Global Hospital`);
    console.log(`      - Address: 456 Medical Complex, NYC 10001\n`);

    // Step 3: Create or use existing certificate file
    console.log('3️⃣  Creating certificate file record...');
    
    // Create a dummy PDF file for testing
    const storageDir = 'C:/Users/shiva kumar/Desktop/storage';
    const fileName = `cert-${Date.now()}.pdf`;
    const filePath = path.join(storageDir, fileName);
    
    // Create a simple PDF content (minimal valid PDF)
    const pdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n trailer<</Size 4/Root 1 0 R>>startxref 190 %%EOF',
      'utf-8'
    );
    
    fs.writeFileSync(filePath, pdfContent);
    console.log(`   ✅ Created certificate file: ${fileName}\n`);

    // Step 4: Insert file record in database
    console.log('4️⃣  Recording file in database...');
    const [fileResult] = await db.execute(
      'INSERT INTO files (user_id, file_name, file_path, file_type, uploaded_at) VALUES (?, ?, ?, ?, NOW())',
      [doctorId, 'Doctor_Certificate.pdf', filePath, 'certificate']
    );
    const fileId = fileResult.insertId;
    console.log(`   ✅ File recorded with ID: ${fileId}\n`);

    // Step 5: Create approval request (pending status)
    console.log('5️⃣  Creating approval request...');
    const [approvalResult] = await db.execute(
      'INSERT INTO doctor_approvals (doctor_id, certificate_file_id, status, submitted_at) VALUES (?, ?, ?, NOW())',
      [doctorId, fileId, 'pending']
    );
    const approvalId = approvalResult.insertId;
    console.log(`   ✅ Created approval request ${approvalId} with status: PENDING\n`);

    // Step 6: Verify the complete setup
    console.log('6️⃣  Verifying complete setup...\n');

    const [[userCheck]] = await db.query('SELECT * FROM users WHERE id = ?', [doctorId]);
    const [[profileCheck]] = await db.query('SELECT * FROM doctor_profiles WHERE user_id = ?', [doctorId]);
    const [[fileCheck]] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    const [[approvalCheck]] = await db.query('SELECT * FROM doctor_approvals WHERE id = ?', [approvalId]);

    console.log('   ✅ User Record:');
    console.log(`      ID: ${userCheck.id}, Name: ${userCheck.name}, Email: ${userCheck.email}, Role: ${userCheck.role}`);

    console.log('\n   ✅ Profile Record:');
    console.log(`      ID: ${profileCheck.id}, Specialization: ${profileCheck.specialization}`);
    console.log(`      Experience: ${profileCheck.experience}, Hospital: ${profileCheck.hospital_name}`);
    console.log(`      Address: ${profileCheck.address}`);

    console.log('\n   ✅ File Record:');
    console.log(`      ID: ${fileCheck.id}, Name: ${fileCheck.file_name}, Path: ${fileCheck.file_path}`);
    console.log(`      Exists on Disk: ${fs.existsSync(filePath) ? '✅ YES' : '❌ NO'}`);

    console.log('\n   ✅ Approval Record:');
    console.log(`      ID: ${approvalCheck.id}, Status: ${approvalCheck.status}, Doctor ID: ${approvalCheck.doctor_id}`);
    console.log(`      Certificate File ID: ${approvalCheck.certificate_file_id}`);
    console.log(`      Submitted: ${approvalCheck.submitted_at}`);

    console.log('\n\n🎉 TEST DOCTOR CREATED SUCCESSFULLY!\n');
    console.log('📋 Next Steps:');
    console.log('=================================================');
    console.log(`1. Login as admin`);
    console.log(`2. Go to "Doctor Approval Requests" page`);
    console.log(`3. You should see: "Dr. Test Doctor" with pending approval`);
    console.log(`4. Click "View Details" or "View Certificate"`);
    console.log(`5. Verify you can see:`);
    console.log(`   ✅ Specialization: Neurology`);
    console.log(`   ✅ Experience: 8 years`);
    console.log(`   ✅ Hospital: Global Hospital`);
    console.log(`   ✅ Address: 456 Medical Complex, NYC 10001`);
    console.log(`   ✅ Certificate file`);
    console.log(`6. Test "Download Certificate" button`);
    console.log(`7. Test "Approve Doctor" button`);
    console.log(`=================================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestDoctorWithApproval();
