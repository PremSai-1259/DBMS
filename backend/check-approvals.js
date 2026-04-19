require('dotenv').config()
const db = require('./configs/db')

async function checkApproval() {
  try {
    console.log('\n🔍 Checking Doctor Approval Status...\n')
    
    const query = `
      SELECT 
        da.id,
        da.doctor_id,
        da.status,
        da.admin_message,
        da.submitted_at,
        da.reviewed_at,
        u.name as doctor_name,
        u.email
      FROM doctor_approvals da
      JOIN users u ON da.doctor_id = u.id
      ORDER BY da.id DESC
      LIMIT 10
    `
    
    const [rows] = await db.execute(query)
    
    if (rows.length === 0) {
      console.log('❌ No approvals found in database\n')
      process.exit(0)
    }
    
    console.log('📋 Approval Records (Last 10):\n')
    rows.forEach(row => {
      console.log(`ID: ${row.id}`)
      console.log(`  Doctor: ${row.doctor_name} (${row.email})`)
      console.log(`  Status: ${row.status}`)
      console.log(`  Submitted: ${row.submitted_at}`)
      if (row.reviewed_at) console.log(`  Reviewed: ${row.reviewed_at}`)
      if (row.admin_message) console.log(`  Message: ${row.admin_message}`)
      console.log('')
    })
    
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    process.exit(0)
  }
}

checkApproval()
