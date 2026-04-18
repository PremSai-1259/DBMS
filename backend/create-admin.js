require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./configs/db');

async function createAdmin() {
  try {
    console.log('🔐 Creating Admin User...\n');

    // Admin credentials
    const adminName = 'System Admin';
    const adminEmail = 'admin@healthcare.com';
    const adminPassword = 'admin@123'; // Change this to a strong password

    console.log('Admin Details:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Role: admin\n`);

    // Check if admin already exists
    const [existingAdmin] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [adminEmail, 'admin']
    );

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('❌ Admin user already exists!');
      process.exit(0);
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Insert admin user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [adminName, adminEmail, hashedPassword, 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log(`\nAdmin ID: ${result.insertId}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\nYou can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
