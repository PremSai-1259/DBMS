const http = require('http');

// Simulate doctor login (ID 40 from database)
const doctorId = 40;

// Make request to backend
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/access/requests',
  method: 'GET',
  headers: {
    'Authorization': `Bearer dummy-token`, // Backend might not validate in test
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.end();
