/**
 * 🔧 Fix Script: Recreate Missing Profiles for Approved Doctors
 * 
 * For doctors who are approved but don't have profiles (likely due to test data),
 * this script creates minimal profiles and links their certificates.
 */

const db = require('../configs/db');

async function fixMissingProfiles() {
  try {
    console.log('🔧 Starting profile recreation and certificate linking...\n');

    // Find approved doctors without profiles
    const [missingProfiles] = await db.execute(`
      SELECT 
        da.doctor_id,
        u.name,
        u.email,
        da.certificate_file_id,
        da.reviewed_at
      FROM doctor_approvals da
      JOIN users u ON da.doctor_id = u.id
      LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE da.status = 'approved' AND dp.id IS NULL
      ORDER BY da.doctor_id
    `);

    console.log(`Found ${missingProfiles.length} approved doctors without profiles\n`);

    if (missingProfiles.length === 0) {
      console.log('✅ No missing profiles to fix!\n');
      process.exit(0);
    }

    let created = 0;
    let failed = 0;

    for (const doctor of missingProfiles) {
      try {
        console.log(`📋 Creating profile for: ${doctor.name} (Doctor ID: ${doctor.doctor_id})`);
        
        // Create minimal profile with default values
        const [result] = await db.execute(`
          INSERT INTO doctor_profiles 
          (user_id, specialization, experience, hospital_name, address, certificate_file_id, is_verified)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [
          doctor.doctor_id,
          'General Medicine',     // Default specialization
          5,                       // Default experience
          'Healthcare Center',    // Default hospital
          'Healthcare Services',  // Default address
          doctor.certificate_file_id,  // Link certificate immediately
          true                    // Already verified (already approved)
        ]);

        if (result.affectedRows > 0) {
          console.log(`   ✅ Profile created and certificate linked (Cert ID: ${doctor.certificate_file_id})\n`);
          created++;
        } else {
          console.log(`   ❌ Profile creation returned 0 affected rows\n`);
          failed++;
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
        failed++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ❌ Failed: ${failed}\n`);

    // Verify the fix
    console.log('Step 2️⃣  : Verifying fix...\n');
    const [verified] = await db.execute(`
      SELECT 
        u.name,
        dp.specialization,
        dp.experience,
        dp.hospital_name,
        dp.address,
        dp.certificate_file_id,
        dp.is_verified,
        da.status
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      LEFT JOIN doctor_approvals da ON u.id = da.doctor_id
      WHERE da.status = 'approved'
      ORDER BY dp.user_id
    `);

    console.log('All approved doctors with profiles:\n');
    verified.forEach((doc, idx) => {
      console.log(`  ${idx + 1}. ${doc.name}`);
      console.log(`     Specialization: ${doc.specialization}`);
      console.log(`     Experience: ${doc.experience} years`);
      console.log(`     Hospital: ${doc.hospital_name}`);
      console.log(`     Certificate ID: ${doc.certificate_file_id || 'None'}`);
      console.log(`     Verified: ${doc.is_verified ? 'Yes ✅' : 'No'}\n`);
    });

    console.log('✅ Profile fix complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error in fix process:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixMissingProfiles();
