const db = require('./configs/db');

async function verifyCleanup() {
  try {
    const [[total]] = await db.query('SELECT COUNT(*) as total FROM doctor_profiles');
    const [[nullCount]] = await db.query(
      'SELECT COUNT(*) as count FROM doctor_profiles WHERE specialization IS NULL OR experience IS NULL OR hospital_name IS NULL OR address IS NULL'
    );

    console.log('\n📊 Database Status:');
    console.log(`Total Doctor Profiles: ${total.total}`);
    console.log(`Incomplete (NULL) Profiles: ${nullCount.count}`);

    if (nullCount.count === 0) {
      console.log('\n✅ ALL FIXED! Database is 100% clean.\n');
    } else {
      console.log(`\n⚠️  Still have ${nullCount.count} incomplete profiles\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyCleanup();
