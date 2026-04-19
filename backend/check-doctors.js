const db = require('./configs/db');

(async () => {
  try {
    // Get all doctors
    const query = `
      SELECT u.id, u.name, u.email, u.role, dp.specialization
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'doctor'
      ORDER BY u.id
    `;
    const [doctors] = await db.execute(query);
    console.log('\n=== ALL DOCTORS IN SYSTEM ===');
    console.table(doctors);

    // Get all access requests
    const accessQuery = `
      SELECT ra.id, ra.doctor_id, u_doc.name as doctor_name, ra.patient_id, u_pat.name as patient_name, 
             ra.status, f.file_name
      FROM record_access ra
      JOIN users u_doc ON ra.doctor_id = u_doc.id
      JOIN users u_pat ON ra.patient_id = u_pat.id
      JOIN files f ON ra.file_id = f.id
      ORDER BY ra.id DESC
    `;
    const [accessRecords] = await db.execute(accessQuery);
    console.log('\n=== ALL ACCESS RECORDS ===');
    console.table(accessRecords);

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
