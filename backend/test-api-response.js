const db = require('./configs/db');
const jwt = require('jsonwebtoken');

async function testAPI() {
  try {
    // Get doctor
    const [doctors] = await db.execute('SELECT * FROM users WHERE id = 40');
    const doctor = doctors[0];
    
    // Simulate token
    const token = jwt.sign(
      { id: doctor.id, role: doctor.role },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Simulate accessController logic
    const RecordAccessModel = require('./models/RecordAccess');
    const requests = await RecordAccessModel.findByDoctorId(doctor.id);

    // Map like controller does
    const mappedRequests = requests.map(r => ({
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

    console.log('\n✅ API Response that would be sent:');
    console.log(JSON.stringify(
      {
        total: mappedRequests.length,
        requests: mappedRequests
      },
      null,
      2
    ));

    // Test fileId is accessible
    if (mappedRequests.length > 0) {
      const file = mappedRequests[0];
      console.log('\n✅ First file details:');
      console.log(`   - id (request id): ${file.id}`);
      console.log(`   - fileId (file_id): ${file.fileId}`);
      console.log(`   - fileName: ${file.fileName}`);
      console.log(`   - status: ${file.status}`);
      
      if (!file.fileId) {
        console.log('\n❌ ERROR: fileId is undefined!');
      } else {
        console.log(`\n✓ fileId = ${file.fileId} (CORRECT)`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testAPI();
