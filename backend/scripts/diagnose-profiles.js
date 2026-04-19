/**
 * 🔍 Diagnosis: Check Doctor Profiles Status
 */

const db = require('../configs/db');

async function diagnose() {
  try {
    console.log('🔍 Checking approved doctors profile status...\n');
    
    const [noProfiles] = await db.execute(`
      SELECT 
        da.doctor_id,
        da.status,
        u.name,
        u.email,
        CASE WHEN dp.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status,
        da.certificate_file_id
      FROM doctor_approvals da
      JOIN users u ON da.doctor_id = u.id
      LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE da.status = 'approved'
      ORDER BY da.doctor_id
    `);

    console.log('Doctor Profile Status:\n');
    noProfiles.forEach(doc => {
      console.log(`  Doctor ID: ${doc.doctor_id} - ${doc.name} (${doc.email})`);
      console.log(`  Status: ${doc.profile_status}`);
      console.log(`  Certificate File ID: ${doc.certificate_file_id}`);
      console.log('');
    });

    // Count by status
    const noProfileCount = noProfiles.filter(d => d.profile_status === 'NO PROFILE').length;
    const hasProfileCount = noProfiles.filter(d => d.profile_status === 'HAS PROFILE').length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   ❌ Missing Profiles: ${noProfileCount}`);
    console.log(`   ✅ Have Profiles: ${hasProfileCount}`);

    // Show which ones have profiles
    console.log(`\n✅ Doctors WITH profiles:`);
    noProfiles.filter(d => d.profile_status === 'HAS PROFILE').forEach(doc => {
      console.log(`   - ${doc.name} (ID: ${doc.doctor_id})`);
    });

    console.log(`\n❌ Doctors WITHOUT profiles:`);
    noProfiles.filter(d => d.profile_status === 'NO PROFILE').forEach(doc => {
      console.log(`   - ${doc.name} (ID: ${doc.doctor_id})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

diagnose();
