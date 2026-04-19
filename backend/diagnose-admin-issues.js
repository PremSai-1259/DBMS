const db = require('./configs/db');
const fs = require('fs');
const path = require('path');

async function testAdminApprovalFlow() {
  try {
    console.log('🔍 Testing Admin Dashboard & Approval Flow\n');

    // Step 1: Check database directly
    console.log('1️⃣  CHECKING PENDING DOCTOR APPROVALS IN DATABASE');

    // Get pending approvals
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
        dp.hospital_name,
        dp.address,
        f.file_name as certificateFileName,
        f.file_path as certificatePath
      FROM doctor_approvals da
      INNER JOIN users u ON da.doctor_id = u.id
      LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id
      LEFT JOIN files f ON da.certificate_file_id = f.id
      WHERE da.status = 'pending'
    `);

    console.log(`   Found ${pending.length} pending approval(s)\n`);
    
    if (pending.length > 0) {
      pending.forEach((app, i) => {
        console.log(`   ${i + 1}. Doctor: ${app.doctorName} (ID: ${app.doctorId})`);
        console.log(`      Email: ${app.email}`);
        console.log(`      Specialization: ${app.specialization || '❌ NULL'}`);
        console.log(`      Experience: ${app.experience || '❌ NULL'}`);
        console.log(`      Hospital: ${app.hospital_name || '❌ NULL'}`);
        console.log(`      Certificate File: ${app.certificateFileName}`);
        console.log(`      Certificate Path: ${app.certificatePath || '❌ NULL'}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  NO PENDING APPROVALS - No doctors have requested approval yet!');
    }

    // Step 2: Check if certificate files exist
    console.log('\n2️⃣  CHECKING CERTIFICATE FILES ON DISK');
    const storageDir = 'C:/Users/shiva kumar/Desktop/storage';
    console.log(`   Storage directory: ${storageDir}`);
    console.log(`   Exists: ${fs.existsSync(storageDir) ? '✅ YES' : '❌ NO'}`);

    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      console.log(`   Total files in storage: ${files.length}`);
      if (files.length > 0) {
        console.log('   Files:');
        files.slice(0, 10).forEach(f => {
          const filePath = path.join(storageDir, f);
          const stats = fs.statSync(filePath);
          console.log(`   - ${f} (${stats.size} bytes)`);
        });
      }
    }

    // Step 3: Check doctor_profiles table
    console.log('\n3️⃣  CHECKING DOCTOR PROFILES TABLE');
    const [profiles] = await db.query(`
      SELECT 
        dp.id,
        dp.user_id,
        u.name,
        dp.specialization,
        dp.experience,
        dp.hospital_name,
        dp.address,
        dp.is_verified,
        dp.certificate_file_id
      FROM doctor_profiles dp
      LEFT JOIN users u ON dp.user_id = u.id
    `);

    console.log(`   Total profiles: ${profiles.length}\n`);
    if (profiles.length > 0) {
      profiles.forEach(p => {
        console.log(`   User ${p.user_id}: ${p.name}`);
        console.log(`   - Specialization: ${p.specialization ? '✅ ' + p.specialization : '❌ NULL'}`);
        console.log(`   - Experience: ${p.experience ? '✅ ' + p.experience + ' years' : '❌ NULL'}`);
        console.log(`   - Hospital: ${p.hospital_name ? '✅ ' + p.hospital_name : '❌ NULL'}`);
        console.log(`   - Address: ${p.address ? '✅ Yes' : '❌ NULL'}`);
        console.log(`   - Verified: ${p.is_verified ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Certificate File ID: ${p.certificate_file_id || '❌ NULL'}`);
        console.log('');
      });
    }

    // Step 4: Check files table
    console.log('\n4️⃣  CHECKING FILES TABLE');
    const [files] = await db.query(`
      SELECT 
        f.id,
        f.user_id,
        u.name,
        f.file_name,
        f.file_type,
        f.file_path,
        f.uploaded_at
      FROM files f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.uploaded_at DESC
      LIMIT 10
    `);

    console.log(`   Total files: ${files.length}\n`);
    if (files.length > 0) {
      files.forEach(f => {
        console.log(`   File ID ${f.id}: ${f.file_name}`);
        console.log(`   - User: ${f.name} (${f.user_id})`);
        console.log(`   - Type: ${f.file_type}`);
        console.log(`   - Path: ${f.file_path || '❌ NULL'}`);
        console.log(`   - Uploaded: ${f.uploaded_at}`);
        
        // Check if file exists on disk
        if (f.file_path && fs.existsSync(f.file_path)) {
          console.log(`   - On Disk: ✅ YES`);
        } else {
          console.log(`   - On Disk: ❌ MISSING`);
        }
        console.log('');
      });
    }

    // Step 5: Check doctor_approvals table
    console.log('\n5️⃣  CHECKING DOCTOR_APPROVALS TABLE');
    const [approvals] = await db.query(`
      SELECT 
        da.id,
        da.doctor_id,
        u.name,
        da.certificate_file_id,
        da.status,
        da.submitted_at,
        da.reviewed_at
      FROM doctor_approvals da
      LEFT JOIN users u ON da.doctor_id = u.id
      ORDER BY da.submitted_at DESC
    `);

    console.log(`   Total approvals: ${approvals.length}\n`);
    if (approvals.length > 0) {
      approvals.forEach(a => {
        console.log(`   Doctor: ${a.name} (ID: ${a.doctor_id})`);
        console.log(`   - Status: ${a.status}`);
        console.log(`   - Certificate File ID: ${a.certificate_file_id || 'NULL'}`);
        console.log(`   - Submitted: ${a.submitted_at}`);
        console.log(`   - Reviewed: ${a.reviewed_at || '(Not yet reviewed)'}`);
        console.log('');
      });
    }

    console.log('\n✅ DATABASE DIAGNOSTIC COMPLETE\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdminApprovalFlow();
