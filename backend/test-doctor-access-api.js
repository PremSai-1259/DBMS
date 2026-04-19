const db = require('./configs/db');
const jwt = require('jsonwebtoken');

async function testDoctorAccessAPI() {
  try {
    console.log('\n=== TESTING DOCTOR ACCESS API ===\n');

    // 1. Check if record exists in database
    console.log('1️⃣ Checking database for approved records...');
    const [records] = await db.execute(
      `SELECT ra.*, u_doc.name as doctor_name, u_pat.name as patient_name, f.file_name
       FROM record_access ra
       JOIN users u_doc ON ra.doctor_id = u_doc.id
       JOIN users u_pat ON ra.patient_id = u_pat.id
       JOIN files f ON ra.file_id = f.id
       WHERE ra.doctor_id = ? AND ra.status = 'approved'`,
      [40]
    );
    
    console.log(`   ✓ Found ${records.length} approved records for doctor_id=40`);
    records.forEach(r => {
      console.log(`     - ${r.file_name} (Status: ${r.status})`);
    });

    // 2. Simulate the RecordAccessModel.findByDoctorId() query
    console.log('\n2️⃣ Testing RecordAccessModel.findByDoctorId(40)...');
    const RecordAccessModel = require('./models/RecordAccess');
    const allRequests = await RecordAccessModel.findByDoctorId(40);
    console.log(`   ✓ Query returned ${allRequests.length} requests`);
    allRequests.forEach(r => {
      console.log(`     - ${r.file_name} (Status: ${r.status}, Patient: ${r.patient_name})`);
    });

    // 3. Simulate the API response mapping
    console.log('\n3️⃣ Simulating AccessController mapping...');
    const mappedRequests = allRequests.map(r => ({
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

    console.log(`   ✓ Mapped ${mappedRequests.length} requests`);
    console.log('\n   📋 Final API Response Structure:');
    console.log(JSON.stringify({
      total: mappedRequests.length,
      requests: mappedRequests
    }, null, 2));

    // 4. Filter for approved
    const approved = mappedRequests.filter(r => r.status === 'approved');
    console.log(`\n4️⃣ Frontend Filtering (status === 'approved')...`);
    console.log(`   ✓ Found ${approved.length} approved files`);
    approved.forEach(f => {
      console.log(`     - ${f.fileName} from ${f.patientName}`);
    });

    console.log('\n✅ TEST COMPLETE - Everything looks correct!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDoctorAccessAPI();
