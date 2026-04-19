const db = require('./configs/db');

async function fixNullProfiles() {
  try {
    console.log('🔧 Starting to fix NULL profiles...\n');

    // Find all profiles with NULL values in critical fields
    const [nullProfiles] = await db.query(
      `SELECT id, user_id FROM doctor_profiles 
       WHERE specialization IS NULL OR experience IS NULL OR hospital_name IS NULL OR address IS NULL`
    );

    if (nullProfiles.length === 0) {
      console.log('✅ No NULL profiles found! Database is clean.');
      process.exit(0);
    }

    console.log(`❌ Found ${nullProfiles.length} incomplete profile(s) to delete:\n`);

    const profileIds = nullProfiles.map(p => p.id);
    const userIds = nullProfiles.map(p => p.user_id);

    nullProfiles.forEach((p, i) => {
      console.log(`${i + 1}. Profile ID: ${p.id}, User ID: ${p.user_id}`);
    });

    console.log('\n🔄 Deleting incomplete approval records...');

    // Step 1: Delete corresponding approval records
    const [approvalResult] = await db.query(
      `DELETE FROM doctor_approvals WHERE doctor_id IN (${userIds.join(',')})`
    );

    console.log(`✓ Deleted ${approvalResult.affectedRows} approval record(s)\n`);

    console.log('🔄 Deleting incomplete doctor profiles...');

    // Step 2: Delete incomplete doctor profiles
    const [profileResult] = await db.query(
      `DELETE FROM doctor_profiles WHERE id IN (${profileIds.join(',')})`
    );

    console.log(`✓ Deleted ${profileResult.affectedRows} doctor profile(s)\n`);

    console.log('\n✅ FIXED! Database is now clean.\n');
    console.log('📋 What now:');
    console.log('==============================================');
    console.log('These doctors can now create NEW profiles with');
    console.log('proper validation. When they:');
    console.log('');
    console.log('1. Login to their account');
    console.log('2. Go to "Profile Setup" page');
    console.log('3. Fill in ALL required fields:');
    console.log('   ✓ Specialization (3+ characters)');
    console.log('   ✓ Experience (0-70 years)');
    console.log('   ✓ Hospital/Clinic Name');
    console.log('   ✓ Address (10+ characters)');
    console.log('4. Upload certificate');
    console.log('5. Submit for approval');
    console.log('');
    console.log('Their profiles WILL be created with valid data!');
    console.log('==============================================\n');

    // Verify the fix
    console.log('🔍 Verifying fix...\n');
    const [[verifyResult]] = await db.query(
      `SELECT COUNT(*) as count FROM doctor_profiles 
       WHERE specialization IS NULL OR experience IS NULL OR hospital_name IS NULL OR address IS NULL`
    );

    if (verifyResult.count === 0) {
      console.log('✅ Verification PASSED: No NULL profiles remain!\n');
    } else {
      console.log(`⚠️  Warning: ${verifyResult.count} NULL profiles still exist\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixNullProfiles();
