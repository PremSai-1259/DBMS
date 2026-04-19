#!/usr/bin/env node
const https = require('http');

const BASE_URL = 'http://localhost:5000';

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Testing Doctor Approval APIs\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Step 1: Login
    console.log('📍 Step 1: Admin Login');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@healthcare.com',
      password: 'admin@123'
    });

    if (loginRes.status !== 200) {
      console.log(`❌ Login failed (${loginRes.status}):`, loginRes.body);
      process.exit(1);
    }

    const token = loginRes.body.token;
    console.log('✅ Login successful\n');

    // Step 2: Get pending approvals
    console.log('📍 Step 2: Get Pending Doctor Approvals');
    const pendingRes = await makeRequest('GET', '/api/doctor-approvals/pending', null, token);

    if (pendingRes.status !== 200) {
      console.log(`❌ Failed (${pendingRes.status}):`, pendingRes.body);
      process.exit(1);
    }

    const pending = pendingRes.body.pending || [];
    console.log(`✅ Found ${pending.length} pending approval(s)\n`);

    if (pending.length === 0) {
      console.log('⚠️  No pending approvals. Creating test data would be needed.\n');
      process.exit(0);
    }

    const firstDoctor = pending[0];
    console.log(`Doctor: ${firstDoctor.doctor.name}`);
    console.log(`Specialization: ${firstDoctor.doctor.specialization}`);
    console.log(`Doctor ID: ${firstDoctor.doctorId}\n`);

    // Step 3: Get doctor details
    console.log('📍 Step 3: Get Doctor Details & Files');
    const detailsRes = await makeRequest(
      'GET',
      `/api/doctor-approvals/doctor/${firstDoctor.doctorId}/details`,
      null,
      token
    );

    if (detailsRes.status !== 200) {
      console.log(`❌ Failed (${detailsRes.status}):`, detailsRes.body);
      process.exit(1);
    }

    const details = detailsRes.body;
    console.log('✅ Doctor details retrieved!\n');

    console.log('👤 Doctor Profile:');
    console.log(`  Name: ${details.doctor.name}`);
    console.log(`  Email: ${details.doctor.email}`);
    console.log(`  Specialization: ${details.doctor.specialization}`);
    console.log(`  Experience: ${details.doctor.experience} years`);
    console.log(`  Hospital: ${details.doctor.hospitalName}`);
    console.log(`  Address: ${details.doctor.address}`);
    console.log(`  Verified: ${details.doctor.isVerified}\n`);

    console.log('📋 Approval Status:');
    console.log(`  Status: ${details.approval.status}`);
    console.log(`  Submitted: ${details.approval.submittedAt}`);
    if (details.approval.adminMessage) {
      console.log(`  Admin Message: ${details.approval.adminMessage}`);
    }
    console.log('');

    if (details.certificateFile) {
      console.log('📄 Primary Certificate:');
      console.log(`  File: ${details.certificateFile.name}\n`);
    }

    console.log('📁 All Uploaded Files:');
    if (details.allFiles && details.allFiles.length > 0) {
      details.allFiles.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.name}`);
        console.log(`     Type: ${file.type}`);
        console.log(`     Uploaded: ${file.uploadedAt}`);
      });
    } else {
      console.log('  No files uploaded');
    }

    console.log('\n✅ ALL TESTS PASSED!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runTests();
