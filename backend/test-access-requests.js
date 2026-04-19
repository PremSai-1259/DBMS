const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAccessRequests() {
  try {
    // Login as doctor (abcdefg@gmail.com)
    console.log('🔐 Logging in as doctor...\n');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'abcdefg@gmail.com',
      password: 'password123'
    });

    const token = loginRes.data.token;
    console.log('✅ Doctor logged in (ID: 40)\n');

    // Get access requests
    console.log('🔍 Fetching /access/requests endpoint...\n');
    const response = await axios.get(`${API_BASE}/access/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Response Status:', response.status);
    console.log('\n📊 Total Requests:', response.data.total);
    console.log('\n📋 All Requests Data:');
    console.log(JSON.stringify(response.data.requests, null, 2));

    // Filter approved
    const approved = response.data.requests.filter(r => r.status === 'approved');
    console.log(`\n\n✓ Approved Requests Count: ${approved.length}`);
    if (approved.length > 0) {
      console.log('\n✅ FOUND APPROVED FILES:');
      approved.forEach(r => {
        console.log(`  📄 ${r.fileName}`);
        console.log(`     From: ${r.patientName}`);
        console.log(`     Status: ${r.status}`);
        console.log(`     Approved: ${r.updatedAt}\n`);
      });
    } else {
      console.log('❌ NO APPROVED FILES FOUND');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAccessRequests();
