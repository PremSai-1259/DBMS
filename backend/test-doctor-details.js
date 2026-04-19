const http = require('http')

function makeRequest(path, method = 'GET', token = null, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          })
        } catch {
          resolve({
            statusCode: res.statusCode,
            body: data
          })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function runTests() {
  console.log('🧪 Testing Doctor Approval APIs...\n')

  try {
    // Login as admin
    console.log('🔐 Logging in as admin...')
    const loginRes = await makeRequest('/api/auth/login', 'POST', null, {
      email: 'admin@healthcare.com',
      password: 'Admin@123'
    })
    
    if (loginRes.statusCode !== 200) {
      console.log('❌ Login failed:', loginRes.body)
      return
    }

    const token = loginRes.body.token
    console.log('✅ Login successful\n')

    // Test 1: Get pending doctor approvals
    console.log('1️⃣  Testing GET /api/doctor-approvals/pending')
    const pendingRes = await makeRequest('/api/doctor-approvals/pending', 'GET', token)
    console.log(`   Status: ${pendingRes.statusCode}`)
    if (pendingRes.body?.pending && pendingRes.body.pending.length > 0) {
      console.log(`   ✅ Found ${pendingRes.body.pending.length} pending approval(s)`)
      const firstDoctor = pendingRes.body.pending[0]
      console.log(`   Doctor ID: ${firstDoctor.doctorId}, Name: ${firstDoctor.doctor.name}`)

      // Test 2: Get doctor details using the new endpoint
      console.log(`\n2️⃣  Testing GET /api/doctor-approvals/doctor/${firstDoctor.doctorId}/details`)
      const detailsRes = await makeRequest(`/api/doctor-approvals/doctor/${firstDoctor.doctorId}/details`, 'GET', token)
      console.log(`   Status: ${detailsRes.statusCode}`)
      if (detailsRes.statusCode === 200) {
        console.log('   ✅ Doctor details endpoint working!')
        console.log(`   - Doctor Name: ${detailsRes.body.doctor.name}`)
        console.log(`   - Specialization: ${detailsRes.body.doctor.specialization}`)
        console.log(`   - Experience: ${detailsRes.body.doctor.experience} years`)
        console.log(`   - Hospital: ${detailsRes.body.doctor.hospitalName}`)
        console.log(`   - Address: ${detailsRes.body.doctor.address}`)
        console.log(`   - Certificate File: ${detailsRes.body.certificateFile?.name}`)
        console.log(`   - Total Files: ${detailsRes.body.allFiles?.length || 0}`)
        if (detailsRes.body.allFiles && detailsRes.body.allFiles.length > 0) {
          console.log('   Files:')
          detailsRes.body.allFiles.forEach((file, i) => {
            console.log(`     ${i + 1}. ${file.name} (${file.type})`)
          })
        }
      } else {
        console.log(`   ❌ Error: ${detailsRes.statusCode}`)
        console.log(`   ${JSON.stringify(detailsRes.body, null, 2)}`)
      }
    } else {
      console.log('   ⚠️  No pending approvals found')
    }
  } catch (err) {
    console.error('❌ Test error:', err.message)
  }

  console.log('\n✅ Tests completed!')
}

runTests()
