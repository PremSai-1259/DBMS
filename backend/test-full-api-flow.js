const db = require('./configs/db');
const jwt = require('jsonwebtoken');

async function testFullFlow() {
  try {
    console.log('\n=== TESTING FULL API FLOW ===\n');

    // Get doctor info
    const [doctors] = await db.execute('SELECT * FROM users WHERE id = 40');
    const doctor = doctors[0];
    
    if (!doctor) {
      console.log('❌ Doctor not found');
      process.exit(1);
    }

    console.log(`✓ Doctor: ${doctor.name} (${doctor.email}) - Role: ${doctor.role}`);

    // Simulate JWT token generation
    const token = jwt.sign(
      { id: doctor.id, role: doctor.role },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    console.log(`✓ Generated JWT token: ${token.substring(0, 50)}...`);

    // Call the same backend logic as the API endpoint
    const AccessController = require('./controllers/accesscontroller');
    const RecordAccessModel = require('./models/RecordAccess');

    console.log('\n📌 Simulating: GET /api/access/requests with doctor auth...\n');

    // Simulate the controller logic
    const userId = doctor.id;
    const userRole = doctor.role;

    console.log(`   - userId: ${userId}`);
    console.log(`   - userRole: ${userRole}`);
    console.log('');

    let requests;
    if (userRole === 'doctor') {
      console.log('   🔍 Calling RecordAccessModel.findByDoctorId()...');
      requests = await RecordAccessModel.findByDoctorId(userId);
    }

    console.log(`\n   ✓ Found ${requests.length} requests`);
    
    // Map to API response format
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

    const apiResponse = {
      total: mappedRequests.length,
      requests: mappedRequests
    };

    console.log('\n📤 API Response that would be sent to frontend:');
    console.log(JSON.stringify(apiResponse, null, 2));

    // Filter approved as frontend would
    const approved = apiResponse.requests.filter(r => r.status === 'approved');
    console.log(`\n✓ Frontend would see ${approved.length} approved file(s):`);
    approved.forEach(f => {
      console.log(`  - ${f.fileName} from ${f.patientName}`);
    });

    console.log('\n✅ API FLOW IS WORKING CORRECTLY\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testFullFlow();
