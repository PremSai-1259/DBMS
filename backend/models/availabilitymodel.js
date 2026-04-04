const db = require("../configs/db");

// Delete old availability
const deleteAvailability = async (doctor_id, date) => {
  await db.query(
    "DELETE FROM APPOINTMENT_SLOTS WHERE doctor_id=? AND slot_date=?",
    [doctor_id, date]
  );
};

// Insert new slot with slot_number
const insertSlot = async (doctor_id, date, slot_number) => {
  await db.query(
    `INSERT INTO APPOINTMENT_SLOTS (doctor_id, slot_date, slot_number, start_time, end_time) 
     VALUES (?, ?, ?, '09:00:00', '10:00:00')`, 
    [doctor_id, date, slot_number]
  );
};

// Get available slots (unbooked) - ensures slot_id is retrieved
const getAvailableSlots = async (doctor_id, date) => {
  const [rows] = await db.query(
    `SELECT slot_id, slot_number, is_booked FROM APPOINTMENT_SLOTS 
     WHERE doctor_id=? AND slot_date=?`,
    [doctor_id, date]
  );
  return rows;
};

const checkAvailabilityExists = async (doctor_id, date) => {
  const [rows] = await db.query(
    "SELECT * FROM APPOINTMENT_SLOTS WHERE doctor_id=? AND slot_date=? LIMIT 1",
    [doctor_id, date]
  );
  return rows;
};

module.exports = {
  deleteAvailability,
  insertSlot,
  getAvailableSlots,
  checkAvailabilityExists
};