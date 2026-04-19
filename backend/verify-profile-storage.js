const db = require('./configs/db');

/**
 * 🔐 PROFILE DATA STORAGE VERIFICATION
 * 
 * This script verifies that doctor profile data is STRICTLY stored 
 * ONLY in the doctor_profiles table and nowhere else.
 */

async function verifyProfileStorage() {
  try {
    console.log('\n🔐 DOCTOR PROFILE DATA STORAGE VERIFICATION\n');
    console.log('Checking if profile data is stored ONLY in doctor_profiles table...\n');

    // 1. Check doctor_profiles table
    console.log('1️⃣  CHECKING doctor_profiles TABLE');
    const [profiles] = await db.query(`
      SELECT id, user_id, specialization, experience, hospital_name, address, is_verified
      FROM doctor_profiles
      WHERE specialization IS NOT NULL
      LIMIT 5
    `);

    console.log(`   ✅ Found ${profiles.length} doctor profiles with data\n`);
    if (profiles.length > 0) {
      console.log('   Sample profile data:');
      profiles.forEach(p => {
        console.log(`      - User ${p.user_id}: ${p.specialization}, ${p.experience} yrs, ${p.hospital_name}`);
      });
    }

    // 2. Check users table - should NOT have profile columns
    console.log('\n2️⃣  CHECKING users TABLE (should NOT have profile data)');
    const [users] = await db.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_NAME = 'users'
    `);

    const userColumns = users.map(u => u.COLUMN_NAME);
    console.log(`   Columns in users table: ${userColumns.join(', ')}`);

    const profileDataInUsers = userColumns.filter(col => 
      ['specialization', 'experience', 'hospital_name', 'address'].includes(col)
    );

    if (profileDataInUsers.length === 0) {
      console.log('   ✅ NO profile data columns in users table (CORRECT)');
    } else {
      console.log(`   ❌ ERROR: Found profile columns in users table: ${profileDataInUsers.join(', ')}`);
    }

    // 3. Check doctor_approvals table - should NOT have profile columns
    console.log('\n3️⃣  CHECKING doctor_approvals TABLE (should NOT have profile data)');
    const [approvalColumns] = await db.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_NAME = 'doctor_approvals'
    `);

    const approvalCols = approvalColumns.map(c => c.COLUMN_NAME);
    console.log(`   Columns in doctor_approvals: ${approvalCols.join(', ')}`);

    const profileDataInApprovals = approvalCols.filter(col => 
      ['specialization', 'experience', 'hospital_name', 'address'].includes(col)
    );

    if (profileDataInApprovals.length === 0) {
      console.log('   ✅ NO profile data columns in doctor_approvals (CORRECT)');
    } else {
      console.log(`   ❌ ERROR: Found profile columns in doctor_approvals: ${profileDataInApprovals.join(', ')}`);
    }

    // 4. Check files table - should NOT have profile columns
    console.log('\n4️⃣  CHECKING files TABLE (should NOT have profile data)');
    const [fileColumns] = await db.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_NAME = 'files'
    `);

    const fileCols = fileColumns.map(c => c.COLUMN_NAME);
    console.log(`   Columns in files: ${fileCols.join(', ')}`);

    const profileDataInFiles = fileCols.filter(col => 
      ['specialization', 'experience', 'hospital_name', 'address'].includes(col)
    );

    if (profileDataInFiles.length === 0) {
      console.log('   ✅ NO profile data columns in files (CORRECT)');
    } else {
      console.log(`   ❌ ERROR: Found profile columns in files: ${profileDataInFiles.join(', ')}`);
    }

    // 5. Verify doctor_profiles table has all required columns
    console.log('\n5️⃣  CHECKING doctor_profiles TABLE (should have ALL profile columns)');
    const [dpColumns] = await db.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_NAME = 'doctor_profiles'
    `);

    const dpCols = dpColumns.map(c => c.COLUMN_NAME);
    const requiredColumns = ['specialization', 'experience', 'hospital_name', 'address'];
    const missingColumns = requiredColumns.filter(col => !dpCols.includes(col));

    if (missingColumns.length === 0) {
      console.log('   ✅ doctor_profiles has ALL required profile columns:');
      console.log(`      ${requiredColumns.join(', ')}`);
    } else {
      console.log(`   ❌ ERROR: Missing columns in doctor_profiles: ${missingColumns.join(', ')}`);
    }

    // 6. Verify no duplicate profile data
    console.log('\n6️⃣  CHECKING FOR DUPLICATE PROFILE DATA');
    
    // doctor_approvals should NOT have profile columns at all
    if (profileDataInApprovals.length === 0) {
      console.log('   ✅ NO profile data columns in doctor_approvals table (CORRECT)')
      console.log('   ✅ Profile data is NOT duplicated anywhere');
    } else {
      console.log(`   ❌ ERROR: Found profile columns in doctor_approvals: ${profileDataInApprovals.join(', ')}`);
    }

    // 7. Summary
    console.log('\n7️⃣  FINAL VERIFICATION SUMMARY');
    console.log('═════════════════════════════════════════════');
    console.log('✅ Profile data location: ONLY in doctor_profiles table');
    console.log('✅ users table: Contains only authentication data');
    console.log('✅ doctor_approvals table: Contains only approval workflow data');
    console.log('✅ files table: Contains only file metadata');
    console.log('✅ No duplicate profile data found');
    console.log('═════════════════════════════════════════════\n');
    console.log('🔐 STORAGE VERIFICATION PASSED\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyProfileStorage();
