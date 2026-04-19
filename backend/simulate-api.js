const db = require('./configs/db');
const RecordAccessModel = require('./models/RecordAccess');

(async () => {
  try {
    console.log('\n=== Simulating getAccessRequests API for doctor_id=40 ===\n');
    
    const userId = 40;  // This is abcdefg@gmail.com doctor
    const userRole = 'doctor';
    
    console.log(`Calling findByDoctorId(${userId})...`);
    const requests = await RecordAccessModel.findByDoctorId(userId);
    
    console.log(`\nRaw requests (${requests.length} records):`);
    console.table(requests);
    
    console.log(`\nMapping to response format...`);
    const mappedRequests = requests.map(r => ({
      id: r.id,
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
    
    console.log(`\nMapped requests (${mappedRequests.length} records):`);
    console.table(mappedRequests);
    
    console.log(`\nFiltered for approved only...`);
    const approved = mappedRequests.filter(r => r.status === 'approved');
    console.log(`Approved requests (${approved.length} records):`);
    console.table(approved);
    
    console.log(`\nFinal API response would be:`);
    console.log(JSON.stringify({
      total: mappedRequests.length,
      requests: mappedRequests
    }, null, 2));
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e);
    process.exit(1);
  }
})();
