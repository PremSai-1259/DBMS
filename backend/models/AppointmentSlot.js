const db = require('../configs/db');

class AppointmentSlotModel {
  static async generateSlots(doctorId, slotDate) {
    const query = `
      INSERT INTO appointment_slots 
      (doctor_id, slot_date, slot_number, is_active, is_booked) 
      VALUES (?, ?, ?, 1, 0)
    `;
    
    const slots = [];
    for (let i = 1; i <= 24; i++) {
      slots.push([doctorId, slotDate, i]);
    }

    // Execute all inserts
    for (const slot of slots) {
      try {
        await db.execute(query, slot);
      } catch (error) {
        // Ignore duplicate errors
        if (!error.message.includes('Duplicate')) {
          throw error;
        }
      }
    }
    
    return { success: true, slotsCreated: 24 };
  }

  static async getSlotsByDoctorAndDate(doctorId, slotDate) {
    const query = `
      SELECT * FROM appointment_slots 
      WHERE doctor_id = ? AND slot_date = ?
      ORDER BY slot_number ASC
    `;
    const [rows] = await db.execute(query, [doctorId, slotDate]);
    return rows;
  }

  static async getSlotById(slotId) {
    const query = 'SELECT * FROM appointment_slots WHERE id = ?';
    const [rows] = await db.execute(query, [slotId]);
    return rows[0] || null;
  }

  static async markAsBooked(slotId) {
    const query = 'UPDATE appointment_slots SET is_booked = 1 WHERE id = ?';
    const [result] = await db.execute(query, [slotId]);
    return result.affectedRows > 0;
  }

  static async markAsAvailable(slotId) {
    const query = 'UPDATE appointment_slots SET is_booked = 0 WHERE id = ?';
    const [result] = await db.execute(query, [slotId]);
    return result.affectedRows > 0;
  }

  static async getAvailableSlots(doctorId, slotDate) {
    const query = `
      SELECT * FROM appointment_slots 
      WHERE doctor_id = ? AND slot_date = ? AND is_active = 1 AND is_booked = 0
      ORDER BY slot_number ASC
    `;
    const [rows] = await db.execute(query, [doctorId, slotDate]);
    return rows;
  }
}

module.exports = AppointmentSlotModel;
