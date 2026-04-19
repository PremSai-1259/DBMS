const db = require('./configs/db');

(async () => {
  try {
    console.log('\n=== Testing findByDoctorId for doctor_id=40 ===\n');
    
    const query = `
      SELECT ra.*, u_doc.name as doctor_name, u_pat.name as patient_name, f.file_name
      FROM record_access ra
      JOIN users u_doc ON ra.doctor_id = u_doc.id
      JOIN users u_pat ON ra.patient_id = u_pat.id
      JOIN files f ON ra.file_id = f.id
      WHERE ra.doctor_id = ?
      ORDER BY ra.requested_at DESC
    `;
    
    const [rows] = await db.execute(query, [40]);
    
    console.log(`Found ${rows.length} records:`);
    console.table(rows);
    
    // Also test the files table directly
    console.log('\n=== Checking files table ===\n');
    const fileQuery = `
      SELECT id, user_id, file_name, file_type, uploaded_at 
      FROM files 
      WHERE user_id = 41
    `;
    const [files] = await db.execute(fileQuery);
    console.log(`Files for patient_id=41:`);
    console.table(files);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
})();
