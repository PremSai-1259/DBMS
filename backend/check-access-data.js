const db = require('./configs/db');

async function check() {
  try {
    const [records] = await db.execute('SELECT * FROM record_access');
    console.log('\n=== RECORD_ACCESS TABLE ===');
    console.log(JSON.stringify(records, null, 2));
    
    const [files] = await db.execute('SELECT id, file_name, user_id FROM files');
    console.log('\n=== FILES TABLE ===');
    console.log(JSON.stringify(files, null, 2));
    
    const [users] = await db.execute('SELECT id, name, role FROM users WHERE role IN ("doctor", "patient")');
    console.log('\n=== USERS (Doctors/Patients) ===');
    console.log(JSON.stringify(users, null, 2));
    
    // Check what doctor 40 has access to
    const [doctorAccess] = await db.execute('SELECT * FROM record_access WHERE doctor_id = 40');
    console.log('\n=== DOCTOR 40 ACCESS RECORDS ===');
    console.log(JSON.stringify(doctorAccess, null, 2));
  } catch(e) { 
    console.error('Error:', e.message);
  }
  process.exit(0);
}

check();
