const axios = require('axios');

async function testActualAPI() {
  try {
    // Create token for doctor 40
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'abcdefg@gmail.com',
      password: 'password123'
    });

    const token = loginRes.data.token;
    console.log('✓ Doctor logged in');

    // Call the API with authorization
    const response = await axios.get('http://localhost:5000/api/access/requests', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ API Response from backend:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.requests.length > 0) {
      const file = response.data.requests[0];
      console.log('\n✓ First file object:');
      console.log('  Keys:', Object.keys(file));
      console.log('  file.fileId =', file.fileId);
      console.log('  file.file_id =', file.file_id);
      console.log('  file.id =', file.id);
      console.log('  file.fileName =', file.fileName);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testActualAPI();
