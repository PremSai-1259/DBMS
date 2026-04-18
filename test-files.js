const axios = require('axios');

(async () => {
  try {
    console.log('[Test] Starting test...');
    
    // Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'anithareddy11@gmail.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('[Test] Token received:', token.substring(0, 30) + '...');
    
    // Get files
    const filesRes = await axios.get('http://localhost:5000/api/files', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    console.log('[Test] Response status:', filesRes.status);
    console.log('[Test] Response data:', JSON.stringify(filesRes.data, null, 2));
    console.log('[Test] Files count:', filesRes.data.files.length);
    
    if (filesRes.data.files.length > 0) {
      console.log('[Test] ✓ SUCCESS: Files are being returned from API');
      filesRes.data.files.forEach((f, i) => {
        console.log(`  [${i+1}] ${f.file_name}`);
      });
    } else {
      console.log('[Test] ✗ FAIL: No files returned even though database has them');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('[Test] Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();
