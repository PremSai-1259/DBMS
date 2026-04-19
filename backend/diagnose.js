// End-to-end booking diagnostic using fetch
async function diagnose() {
  console.log('=== BOOKING DIAGNOSTIC ===\n');

  let doctors = [];
  let token = '';

  try {
    const res = await fetch('http://localhost:5000/api/doctor-approvals/doctors/approved');
    doctors = await res.json();
    console.log(`✅ Retrieved ${doctors.length} approved doctors`);
  } catch (err) {
    console.log('❌ Failed to fetch approved doctors:', err.message);
    return;
  }

  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hi12@gmail.com', password: '123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log('❌ Login failed:', loginData);
      return;
    }
    token = loginData.token;
    console.log(`✅ Patient login successful (userId=${loginData.user.id})`);
  } catch (err) {
    console.log('❌ Login request failed:', err.message);
    return;
  }

  const doctor = doctors.find((d) => Number(d.doctorId) === 38) || doctors[0];
  if (!doctor) {
    console.log('❌ No doctor found to test booking');
    return;
  }
  console.log(`✅ Using doctorId=${doctor.doctorId}, name=${doctor.doctorName}`);

  let slots = [];
  try {
    const slotsRes = await fetch(`http://localhost:5000/api/slots/doctor/${doctor.doctorId}`);
    slots = await slotsRes.json();
    console.log(`✅ Retrieved ${slots.length} slots for doctor ${doctor.doctorId}`);
  } catch (err) {
    console.log('❌ Failed to fetch slots:', err.message);
    return;
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    console.log('❌ No slots available for test');
    return;
  }

  const slot = slots[0];
  const payload = { doctorId: Number(doctor.doctorId), slotId: Number(slot.id) };
  console.log('📤 Booking payload:', payload);

  try {
    const bookRes = await fetch('http://localhost:5000/api/appointments/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await bookRes.json();
    console.log(`📥 Booking status: ${bookRes.status}`);
    console.log('📥 Booking response:', body);
  } catch (err) {
    console.log('❌ Booking request failed:', err.message);
  }
}

diagnose();
