// Check if patient has profile
async function checkPatient() {
  try {
    // Get patient user
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hi12@gmail.com', password: '123' })
    });
    const loginData = await res.json();
    const patientId = loginData.user.id;
    console.log('Patient ID:', patientId);
    console.log('Token:', loginData.token.substring(0, 20) + '...');
  } catch (err) {
    console.log('Login failed:', err.message);
  }
}

checkPatient();
