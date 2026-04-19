const db = require('./configs/db');

async function testDataStorage() {
  try {
    console.log('🔍 Testing Doctor Profile Data Storage...\n');

    // Check User 10 (should have valid Cardiology data)
    const [[user10]] = await db.query('SELECT * FROM doctor_profiles WHERE user_id = 10');
    
    if (user10) {
      console.log('✅ User 10 Profile:');
      console.log(`   Specialization: ${user10.specialization}`);
      console.log(`   Experience: ${user10.experience} years`);
      console.log(`   Hospital: ${user10.hospital_name}`);
      console.log(`   Address: ${user10.address}`);
      console.log(`   Certificate File ID: ${user10.certificate_file_id}`);
      console.log(`   Verified: ${user10.is_verified}\n`);

      // Verify all critical fields have data
      const hasAllData = user10.specialization && user10.experience && user10.hospital_name && user10.address;
      if (hasAllData) {
        console.log('✅ CORRECT: User 10 has all profile fields stored properly\n');
      } else {
        console.log('❌ ERROR: User 10 missing some profile data\n');
      }
    } else {
      console.log('⚠️  User 10 profile not found\n');
    }

    // Check all profiles
    const [allProfiles] = await db.query('SELECT * FROM doctor_profiles');
    
    console.log(`📊 Total Profiles: ${allProfiles.length}\n`);

    console.log('Checking data storage for all profiles:\n');
    let validProfiles = 0;
    let incompleteProfiles = 0;

    allProfiles.forEach(profile => {
      const hasAllData = profile.specialization && profile.experience && profile.hospital_name && profile.address;
      
      if (hasAllData) {
        validProfiles++;
        console.log(`✅ User ${profile.user_id}: ${profile.specialization} | ${profile.experience}y | ${profile.hospital_name}`);
      } else {
        incompleteProfiles++;
        console.log(`❌ User ${profile.user_id}: INCOMPLETE (some NULL fields)`);
        if (!profile.specialization) console.log(`     - specialization: NULL`);
        if (!profile.experience) console.log(`     - experience: NULL`);
        if (!profile.hospital_name) console.log(`     - hospital_name: NULL`);
        if (!profile.address) console.log(`     - address: NULL`);
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Complete Profiles: ${validProfiles}`);
    console.log(`   ❌ Incomplete Profiles: ${incompleteProfiles}`);

    if (incompleteProfiles === 0) {
      console.log('\n✅ ALL DATA STORED CORRECTLY IN THE RIGHT PLACES!\n');
    } else {
      console.log(`\n⚠️  ${incompleteProfiles} profiles need attention\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testDataStorage();
