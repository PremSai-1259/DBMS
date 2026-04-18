const http = require('http');

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': 'Bearer ' + token })
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    console.log('[Test] Starting test...');
    
    // Login
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'anithareddy11@gmail.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('[Test] Token received:', token.substring(0, 30) + '...');
    
    // Get files
    const filesRes = await makeRequest('GET', '/api/files', null, token);
    
    console.log('[Test] Response status:', filesRes.status);
    console.log('[Test] Response data:', JSON.stringify(filesRes.data, null, 2));
    console.log('[Test] Files count:', filesRes.data.files?.length || 0);
    
    if (filesRes.data.files && filesRes.data.files.length > 0) {
      console.log('[Test] ✓ SUCCESS: Files are being returned from API');
      filesRes.data.files.forEach((f, i) => {
        console.log(`  [${i+1}] ${f.file_name}`);
      });
    } else {
      console.log('[Test] ✗ FAIL: No files returned');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('[Test] Error:', err.message);
    process.exit(1);
  }
})();
