const db = require("../configs/db"); // ✅ also fix path if needed

// Check if slot is booked
const checkSlotBooked = async (doctor_id, date, slot_number) => {
  const [rows] = await db.query(
    `SELECT * FROM appointments 
     WHERE doctor_id=? AND date=? AND slot_number=?`,
    [doctor_id, date, slot_number]
  );
  return rows;
};

// Book slot
const createAppointment = async (doctor_id, patient_id, date, slot_number) => {
  await db.query(
    `INSERT INTO appointments 
     (doctor_id, patient_id, date, slot_number) 
     VALUES (?, ?, ?, ?)`,
    [doctor_id, patient_id, date, slot_number]
  );
};

// Get booked slots
const getBookedSlots = async (doctor_id, date) => {
  const [rows] = await db.query(
    `SELECT slot_number FROM appointments 
     WHERE doctor_id=? AND date=?`,
    [doctor_id, date]
  );
  return rows;
};

// Get all bookings (doctor view)
const getDoctorBookings = async (doctor_id, date) => {
  const query = `
    SELECT * FROM appointments
    WHERE doctor_id = ?
    AND DATE(date) = ?
    ORDER BY slot_number ASC
  `;

  const [rows] = await db.query(query, [doctor_id, date]);
  return rows;
};

module.exports = {
  checkSlotBooked,
  createAppointment,
  getBookedSlots,
  getDoctorBookings,
};