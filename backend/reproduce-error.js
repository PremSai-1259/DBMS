const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_BASE = 'http://localhost:5000/api';

let testData = {};

async function step(number, description) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 STEP ${number}: ${description}`);
  console.log(`${'='.repeat(70)}`);
}

async function jsonRequest(method, url, data, token) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(url, options);
  const json = await res.json();
  
  return { status: res.status, data: json };
}

async function run() {
  try {
    // STEP 1: Register doctor
    await step(1, 'Register new doctor');
    const uniqueEmail = `doctor-${Date.now()}@hospital.com`;
    const signupRes = await jsonRequest('POST', `${API_BASE}/auth/signup`, {
      name: 'Test Doctor',
      email: uniqueEmail,
      password: 'TempPass123!',
      role: 'doctor'
    });
    
    if (signupRes.status !== 201) {
      throw new Error(`Signup failed: ${JSON.stringify(signupRes.data)}`);
    }

    testData.doctorId = signupRes.data.user.id;
    testData.email = uniqueEmail;
    console.log('✅ Doctor registered');
    console.log('   Doctor ID:', testData.doctorId);
    console.log('   Email:', uniqueEmail);

    // STEP 2: Login to get JWT token
    await step(2, 'Login and get JWT token');
    const loginRes = await jsonRequest('POST', `${API_BASE}/auth/login`, {
      email: uniqueEmail,
      password: 'TempPass123!'
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }

    testData.token = loginRes.data.token;
    testData.userRole = loginRes.data.user.role;
    console.log('✅ Login successful');
    console.log('   Token received');
    console.log('   Role:', testData.userRole);

    // STEP 3: Upload certificate file using form data
    await step(3, 'Upload certificate file');
    const testFilePath = path.join(__dirname, 'test-certificate.txt');
    fs.writeFileSync(testFilePath, 'Test Certificate Content\n' + new Date().toISOString());

    const formData = new (require('form-data'))();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('fileType', 'certificate');

    const uploadRes = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testData.token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const uploadData = await uploadRes.json();
    if (uploadRes.status !== 201) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }

    testData.certificateFileId = uploadData.file.id;
    console.log('✅ File uploaded');
    console.log('   File ID:', testData.certificateFileId);
    console.log('   Status:', uploadRes.status);

    fs.unlinkSync(testFilePath);

    // STEP 4: Create doctor profile
    await step(4, 'Create doctor profile');
    const profileRes = await jsonRequest('POST', `${API_BASE}/profile/doctor`, {
      specialization: 'Cardiology',
      experience: 15,
      hospital_name: 'City General Hospital',
      address: '123 Medical Street, Health City, HC 12345'
    }, testData.token);

    if (profileRes.status !== 201) {
      throw new Error(`Profile creation failed: ${JSON.stringify(profileRes.data)}`);
    }

    testData.profileId = profileRes.data.profile.id;
    console.log('✅ Profile created');
    console.log('   Profile ID:', testData.profileId);
    console.log('   Specialization:', profileRes.data.profile.specialization);

    // STEP 5: Request doctor approval
    await step(5, 'Request approval with certificate');
    console.log('Sending approval request with:');
    console.log('   Certificate File ID:', testData.certificateFileId);
    console.log('   Doctor ID:', testData.doctorId);

    const approvalRes = await jsonRequest('POST', `${API_BASE}/doctor-approvals/request`, {
      certificateFileId: testData.certificateFileId
    }, testData.token);

    console.log('Response Status:', approvalRes.status);
    console.log('Response Data:', JSON.stringify(approvalRes.data, null, 2));

    if (approvalRes.status !== 201) {
      console.error('❌ Approval request failed');
      throw new Error(`Approval failed with status ${approvalRes.status}: ${JSON.stringify(approvalRes.data)}`);
    }

    console.log('✅ Approval request sent');
    console.log('   Approval ID:', approvalRes.data.approvalId);

    // STEP 6: Verify approval in database
    await step(6, 'Verify approval in database');
    const db = require('./configs/db');
    const [approvals] = await db.execute(
      'SELECT * FROM doctor_approvals WHERE doctor_id = ? ORDER BY id DESC LIMIT 1',
      [testData.doctorId]
    );
    if (approvals.length > 0) {
      console.log('✅ Approval record found in database');
      console.log('   ID:', approvals[0].id);
      console.log('   Status:', approvals[0].status);
      console.log('   Submitted At:', approvals[0].submitted_at);
      console.log('   Reviewed At:', approvals[0].reviewed_at);
    } else {
      console.error('❌ No approval record found');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ END-TO-END TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.error('='.repeat(70));
    process.exit(1);
  }
}

run();
