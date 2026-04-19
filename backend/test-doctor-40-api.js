const db = require('./configs/db');

async function testDoctorAccessAPI() {
  try {
    console.log('\n=== SIMULATING DOCTOR 40 API CALL ===\n');
    
    // Simulate doctor 40's API call
    const doctorId = 40;
    const query = `
      SELECT ra.*, u_doc.name as doctor_name, u_pat.name as patient_name, f.file_name
      FROM record_access ra
      JOIN users u_doc ON ra.doctor_id = u_doc.id
      JOIN users u_pat ON ra.patient_id = u_pat.id
      JOIN files f ON ra.file_id = f.id
      WHERE ra.doctor_id = ?
      ORDER BY ra.requested_at DESC
    `;
    
    const [rows] = await db.execute(query, [doctorId]);
    console.log('Raw query results:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Map to frontend format
    const mappedRequests = rows.map(r => ({
      id: r.id,
      fileId: r.file_id,
      doctorId: r.doctor_id,
      doctorName: r.doctor_name,
      patientId: r.patient_id,
      patientName: r.patient_name,
      fileName: r.file_name,
      status: r.status,
      requestedAt: r.requested_at,
      updatedAt: r.updated_at,
      expiresAt: r.expires_at
    }));
    
    console.log('\nMapped requests (as sent to frontend):');
    console.log(JSON.stringify(mappedRequests, null, 2));
    
    // Filter for approved
    const approved = mappedRequests.filter(r => r.status === 'approved');
    console.log('\nApproved only:');
    console.log(JSON.stringify(approved, null, 2));
    
    if (approved.length > 0) {
      console.log('\nFirst approved fileId:', approved[0].fileId);
      console.log('First approved file name:', approved[0].fileName);
    }
  } catch(e) { 
    console.error('Error:', e.message);
  }
  process.exit(0);
}

testDoctorAccessAPI();
