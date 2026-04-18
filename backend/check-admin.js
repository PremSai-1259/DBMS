require('dotenv').config();
const db = require('./configs/db');

async function checkAdmin() {
  try {
    const [admins] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE role = ?',
      ['admin']
    );

    console.log('Admin users found:', admins.length);
    if (admins.length > 0) {
      console.log('\n✅ Admins in database:');
      admins.forEach(admin => {
        console.log(`  - ID: ${admin.id}`);
        console.log(`    Email: ${admin.email}`);
        console.log(`    Name: ${admin.name}\n`);
      });
    } else {
      console.log('❌ No admin users found in database');
    }

    // Also show total users
    const [allUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log(`Total users in database: ${allUsers[0].count}`);

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

checkAdmin();
