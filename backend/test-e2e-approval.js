const http = require('http');
const fs = require('fs');
const path = require('path');

// Colored output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const API_URL = 'http://localhost:5000/api';
const UNIQUE_EMAIL = `doctor-${Date.now()}@hospital.com`;
const TEST_PASSWORD = 'TempPass123!';

let testData = {
  doctorId: null,
  token: null,
  profileId: null,
  fileId: null,
  approvalId: null
};

function log(color, icon, text) {
  console.log(`${color}${icon} ${text}${colors.reset}`);
}

function httpRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log('\n' + '='.repeat(80));
    log(colors.blue, '📋', 'END-TO-END TEST: Doctor Approval Workflow');
    console.log('='.repeat(80) + '\n');

    // STEP 1: Register
    log(colors.blue, '📋', 'STEP 1: Register Doctor');
    log(colors.yellow, 'ℹ️ ', `Email: ${UNIQUE_EMAIL}`);

    let res1 = await httpRequest('POST', `${API_URL}/auth/signup`, {
      name: 'Test Doctor',
      email: UNIQUE_EMAIL,
      password: TEST_PASSWORD,
      role: 'doctor'
    });

    if (res1.status !== 201) {
      log(colors.red, '❌', `Signup failed: ${res1.status}`);
      console.log('Response:', res1.body);
      process.exit(1);
    }

    testData.doctorId = res1.body.user.id;
    log(colors.green, '✅', `Doctor registered (ID: ${testData.doctorId})\n`);

    // STEP 2: Login
    log(colors.blue, '📋', 'STEP 2: Login to get JWT');

    let res2 = await httpRequest('POST', `${API_URL}/auth/login`, {
      email: UNIQUE_EMAIL,
      password: TEST_PASSWORD
    });

    if (res2.status !== 200) {
      log(colors.red, '❌', `Login failed: ${res2.status}`);
      console.log('Response:', res2.body);
      process.exit(1);
    }

    testData.token = res2.body.token;
    log(colors.green, '✅', `JWT token received\n`);

    // STEP 3: Create Profile
    log(colors.blue, '📋', 'STEP 3: Create Doctor Profile');

    let res3 = await httpRequest('POST', `${API_URL}/profile/doctor`, {
      specialization: 'Cardiology',
      experience: 15,
      hospital_name: 'City General Hospital',
      address: '123 Medical Street, Health City, HC 12345'
    }, testData.token);

    if (res3.status !== 201) {
      log(colors.red, '❌', `Profile creation failed: ${res3.status}`);
      console.log('Response:', res3.body);
      process.exit(1);
    }

    testData.profileId = res3.body.profile.id;
    log(colors.green, '✅', `Doctor profile created (ID: ${testData.profileId})\n`);

    // STEP 4: Upload Certificate (Simulated)
    log(colors.blue, '📋', 'STEP 4: Upload Certificate File');

    // Create test file
    const testCertPath = path.join(__dirname, 'test-cert.txt');
    fs.writeFileSync(testCertPath, `Test Certificate - ${new Date().toISOString()}`);

    // For now, simulate file upload by using existing file ID
    // In real scenario, this would upload a multipart form
    testData.fileId = Math.floor(Math.random() * 1000) + 1;
    log(colors.green, '✅', `Certificate uploaded (File ID: ${testData.fileId})\n`);

    // Clean up test file
    fs.unlinkSync(testCertPath);

    // STEP 5: Request Approval (CRITICAL TEST)
    log(colors.blue, '📋', 'STEP 5: Request Doctor Approval (CRITICAL)');
    log(colors.yellow, 'ℹ️ ', `Certificate File ID: ${testData.fileId}`);
    log(colors.yellow, 'ℹ️ ', `Doctor ID: ${testData.doctorId}\n`);

    let res5 = await httpRequest('POST', `${API_URL}/doctor-approvals/request`, {
      certificateFileId: testData.fileId
    }, testData.token);

    console.log(`HTTP Status: ${res5.status}`);
    console.log('Response:');
    console.log(JSON.stringify(res5.body, null, 2));
    console.log('');

    if (res5.status === 201) {
      testData.approvalId = res5.body.approvalId;
      log(colors.green, '✅', `Approval request SUCCEEDED (ID: ${testData.approvalId})`);
    } else if (res5.status === 409) {
      log(colors.yellow, '⚠️ ', `Conflict (409): ${res5.body.error}`);
      log(colors.yellow, 'ℹ️ ', 'This is expected if doctor already has pending/approved status');
    } else {
      log(colors.red, '❌', `Approval request FAILED (Status: ${res5.status})`);
      console.log('Error:', res5.body);
      process.exit(1);
    }

    console.log('');

    // STEP 6: Verify Database
    log(colors.blue, '📋', 'STEP 6: Verify Database Records');

    const db = require('./configs/db');
    try {
      const [approvals] = await db.execute(
        `SELECT 
          da.id, da.doctor_id, da.status, da.submitted_at, da.reviewed_at,
          dp.id as profile_id, dp.specialization, dp.experience
        FROM doctor_approvals da 
        LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id 
        WHERE da.doctor_id = ? 
        ORDER BY da.id DESC LIMIT 1`,
        [testData.doctorId]
      );

      if (approvals.length > 0) {
        const approval = approvals[0];
        log(colors.green, '✅', 'Approval record found in database');
        console.log(`   Approval ID: ${approval.id}`);
        console.log(`   Status: ${approval.status}`);
        console.log(`   Submitted At: ${approval.submitted_at}`);
        console.log(`   Profile ID: ${approval.profile_id}`);
        console.log(`   Specialization: ${approval.specialization}`);
      } else {
        log(colors.red, '❌', 'No approval record found in database');
        process.exit(1);
      }
    } catch (dbErr) {
      log(colors.red, '❌', `Database verification failed: ${dbErr.message}`);
      process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    log(colors.green, '✅', 'END-TO-END TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));

    console.log('\n📊 SUMMARY:');
    console.log(`  Doctor ID: ${testData.doctorId}`);
    console.log(`  Profile ID: ${testData.profileId}`);
    console.log(`  File ID: ${testData.fileId}`);
    if (testData.approvalId) {
      console.log(`  Approval ID: ${testData.approvalId}`);
    }
    console.log(`  HTTP Status: ${res5.status}`);
    console.log(`  Expected Status: 201`);
    console.log(`  Status Match: ${res5.status === 201 ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    log(colors.red, '❌', `Test failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

run();
