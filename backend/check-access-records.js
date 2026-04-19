const db = require('./configs/db');

(async () => {
  try {
    const query = `
      SELECT 
        ra.id,
        ra.doctor_id,
        ra.patient_id,
        ra.status,
        u_doc.name as doctor_name,
        u_pat.name as patient_name,
        f.file_name
      FROM record_access ra
      JOIN users u_doc ON ra.doctor_id = u_doc.id
      JOIN users u_pat ON ra.patient_id = u_pat.id
      JOIN files f ON ra.file_id = f.id
      ORDER BY ra.id DESC
      LIMIT 10
    `;
    const [rows] = await db.execute(query);
    console.log('Access Records:');
    console.table(rows);
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
