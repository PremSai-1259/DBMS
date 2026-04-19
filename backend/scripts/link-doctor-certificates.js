/**
 * 🔗 Fix Script: Link Doctor Certificates to Profiles
 * 
 * This script finds all approved doctors whose certificates haven't been linked to their profiles
 * and links them from the doctor_approvals table to the doctor_profiles table.
 * 
 * Usage: node scripts/link-doctor-certificates.js
 */

const db = require('../configs/db');

async function linkCertificates() {
  try {
    console.log('🔍 Starting doctor certificate linking process...\n');

    // Step 1: Find approved doctors
    console.log('Step 1️⃣  : Fetching approved doctors...');
    const [approvedDoctors] = await db.execute(`
      SELECT 
        da.id as approval_id,
        da.doctor_id,
        da.certificate_file_id,
        dp.certificate_file_id as profile_cert_id,
        u.name,
        u.email
      FROM doctor_approvals da
      JOIN users u ON da.doctor_id = u.id
      LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE da.status = 'approved'
      ORDER BY da.reviewed_at DESC
    `);

    console.log(`✅ Found ${approvedDoctors.length} approved doctors\n`);

    if (approvedDoctors.length === 0) {
      console.log('✅ No approved doctors to process\n');
      return;
    }

    // Step 2: Analyze which ones need certificate linking
    console.log('Step 2️⃣  : Analyzing certificate status...\n');
    
    let needsLinking = 0;
    let alreadyLinked = 0;
    let noCertificate = 0;
    
    approvedDoctors.forEach((doctor, idx) => {
      const status = doctor.profile_cert_id ? 'Already Linked' : 
                     doctor.certificate_file_id ? 'Needs Linking' : 
                     'No Certificate';
      
      if (status === 'Needs Linking') {
        needsLinking++;
      } else if (status === 'Already Linked') {
        alreadyLinked++;
      } else {
        noCertificate++;
      }

      console.log(`  ${idx + 1}. Doctor: ${doctor.name} (ID: ${doctor.doctor_id})`);
      console.log(`     Email: ${doctor.email}`);
      console.log(`     Approval ID: ${doctor.approval_id}`);
      console.log(`     Cert in Approval: ${doctor.certificate_file_id || 'None'}`);
      console.log(`     Cert in Profile: ${doctor.profile_cert_id || 'None'}`);
      console.log(`     Status: ${status}\n`);
    });

    console.log(`📊 Summary:`);
    console.log(`   ✅ Already Linked: ${alreadyLinked}`);
    console.log(`   🔗 Need Linking: ${needsLinking}`);
    console.log(`   ❌ No Certificate: ${noCertificate}\n`);

    if (needsLinking === 0) {
      console.log('✅ All approved doctors have certificates properly linked!\n');
      return;
    }

    // Step 3: Link certificates
    console.log(`Step 3️⃣  : Linking ${needsLinking} doctor certificates to profiles...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const doctor of approvedDoctors) {
      if (doctor.profile_cert_id || !doctor.certificate_file_id) {
        continue; // Skip if already linked or no cert
      }

      try {
        console.log(`  Linking certificate ${doctor.certificate_file_id} for doctor ${doctor.doctor_id}...`);
        
        const [result] = await db.execute(`
          UPDATE doctor_profiles
          SET certificate_file_id = ?
          WHERE user_id = ?
        `, [doctor.certificate_file_id, doctor.doctor_id]);

        if (result.affectedRows > 0) {
          console.log(`  ✅ Successfully linked for ${doctor.name}\n`);
          successCount++;
        } else {
          console.log(`  ❌ Update returned 0 affected rows for ${doctor.name}\n`);
          failCount++;
        }
      } catch (err) {
        console.error(`  ❌ Error linking certificate: ${err.message}\n`);
        failCount++;
      }
    }

    console.log('\n📊 Linking Results:');
    console.log(`   ✅ Successfully linked: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}\n`);

    // Step 4: Verify
    console.log('Step 4️⃣  : Verifying results...\n');
    const [verifyResults] = await db.execute(`
      SELECT 
        u.name,
        u.email,
        dp.certificate_file_id,
        da.certificate_file_id as approval_cert,
        da.status
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN doctor_approvals da ON u.id = da.doctor_id AND da.status = 'approved'
      ORDER BY da.reviewed_at DESC
      LIMIT 10
    `);

    console.log('Recent doctor certificate status:');
    verifyResults.forEach((doctor, idx) => {
      const linked = doctor.certificate_file_id ? '✅ Linked' : '❌ Not Linked';
      console.log(`  ${idx + 1}. ${doctor.name} - ${linked} (Cert ID: ${doctor.certificate_file_id || 'None'})`);
    });

    console.log('\n✅ Doctor certificate linking process complete!\n');

  } catch (error) {
    console.error('❌ Error in linking process:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the script
linkCertificates();
