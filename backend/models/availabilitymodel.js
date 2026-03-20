const db = require("../configs/db");

// Delete old availability
const deleteAvailability = async (doctor_id, date) => {
  await db.query(
    "DELETE FROM doctor_availability WHERE doctor_id=? AND date=?",
    [doctor_id, date]
  );
};

// Insert new slot
const insertSlot = async (doctor_id, date, slot) => {
  await db.query(
    `INSERT INTO doctor_availability (doctor_id, date, slot_number) 
     VALUES (?, ?, ?)`,
    [doctor_id, date, slot]
  );
};

// Get available slots
const getAvailableSlots = async (doctor_id, date) => {
  const [rows] = await db.query(
    `SELECT slot_number FROM doctor_availability 
     WHERE doctor_id=? AND date=?`,
    [doctor_id, date]
  );
  return rows;
};

const checkAvailabilityExists = async (doctor_id, date) => {
  const [rows] = await db.query(
    "SELECT * FROM doctor_availability WHERE doctor_id=? AND date=? LIMIT 1",
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