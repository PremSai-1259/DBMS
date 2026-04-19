require('dotenv').config()
const db = require('./configs/db')

async function fixDoctorProfiles() {
  try {
    console.log('\n🔧 Fixing Doctor Profiles with NULL Values...\n')

    // Get all doctor profiles with NULL specialization
    const query = `
      SELECT dp.id, dp.user_id, u.name, u.email, dp.specialization, dp.experience, dp.hospital_name, dp.address
      FROM doctor_profiles dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.specialization IS NULL OR dp.experience IS NULL 
         OR dp.hospital_name IS NULL OR dp.address IS NULL
    `

    const [nullProfiles] = await db.execute(query)

    if (nullProfiles.length === 0) {
      console.log('✅ No profiles with NULL values found!\n')
      process.exit(0)
    }

    console.log(`Found ${nullProfiles.length} profiles with NULL values:\n`)
    
    nullProfiles.forEach((profile, i) => {
      console.log(`${i + 1}. ${profile.name} (${profile.email})`)
      console.log(`   Specialization: ${profile.specialization || 'NULL'}`)
      console.log(`   Experience: ${profile.experience || 'NULL'}`)
      console.log(`   Hospital: ${profile.hospital_name || 'NULL'}`)
      console.log(`   Address: ${profile.address || 'NULL'}\n`)
    })

    // Count total doctors and approved doctors
    const [totalDoctors] = await db.execute('SELECT COUNT(*) as count FROM doctor_profiles')
    const [approvedDoctors] = await db.execute(
      'SELECT COUNT(*) as count FROM doctor_profiles WHERE is_verified = 1'
    )
    
    console.log(`Total Doctor Profiles: ${totalDoctors[0].count}`)
    console.log(`Verified Doctors: ${approvedDoctors[0].count}`)
    console.log(`Profiles needing data: ${nullProfiles.length}\n`)

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    process.exit(0)
  }
}

fixDoctorProfiles()
