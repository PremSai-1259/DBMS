const db = require("../configs/db");

// --- ID LOOKUP UTILITIES ---
const getDoctorIdByUserId = async (user_id) => {
  const [rows] = await db.query(
    "SELECT doctor_id FROM DOCTORS WHERE user_id = ?",
    [user_id]
  );
  return rows.length > 0 ? rows[0].doctor_id : null;
};

const getPatientIdByUserId = async (user_id) => {
  const [rows] = await db.query(
    "SELECT patient_id FROM PATIENTS WHERE user_id = ?",
    [user_id]
  );
  return rows.length > 0 ? rows[0].patient_id : null;
};

// --- BOOKING LOGIC ---
const checkSlotBooked = async (doctor_id, date, slot_number) => {
  const [rows] = await db.query(
    `SELECT * FROM APPOINTMENTS 
     WHERE doctor_id=? AND appointment_date=? AND slot_number=?`,
    [doctor_id, date, slot_number]
  );
  return rows;
};

const createAppointment = async (doctor_id, patient_id, date, slot_number, slot_id, reason) => {
  const [result] = await db.query(
    `INSERT INTO APPOINTMENTS 
     (doctor_id, patient_id, appointment_date, slot_number, slot_id, reason) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [doctor_id, patient_id, date, slot_number, slot_id, reason]
  );
  return result;
};

const getBookedSlots = async (doctor_id, date) => {
  const [rows] = await db.query(
    `SELECT slot_number FROM APPOINTMENTS 
     WHERE doctor_id=? AND appointment_date=?`,
    [doctor_id, date]
  );
  return rows;
};

const getDoctorBookings = async (doctor_id, date) => {
  const query = `
    SELECT 
      a.*, 
      p.full_name AS patient_name, 
      p.phone AS patient_phone
    FROM APPOINTMENTS a
    JOIN PATIENTS p ON a.patient_id = p.patient_id
    WHERE a.doctor_id = ? 
    AND DATE(a.appointment_date) = DATE(?)
    ORDER BY a.slot_number ASC
  `;
  const [rows] = await db.query(query, [doctor_id, date]);
  return rows;
};

module.exports = {
  getDoctorIdByUserId,
  getPatientIdByUserId,
  checkSlotBooked,
  createAppointment,
  getBookedSlots,
  getDoctorBookings,
};