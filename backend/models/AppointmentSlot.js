const db = require('../configs/db');

class AppointmentSlot {
  /**
   * Convert 24-hour time to 12-hour format with AM/PM
   */
  static convertTo12Hour(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  /**
   * Generate slot timing information (22 slots - skipping lunch break 9-10)
   */
  static generateSlotTimes() {
    return [
      { slot: 1, start: '08:00', end: '08:30' },
      { slot: 2, start: '08:30', end: '09:00' },
      { slot: 3, start: '09:00', end: '09:30' },
      { slot: 4, start: '09:30', end: '10:00' },
      { slot: 5, start: '10:00', end: '10:30' },
      { slot: 6, start: '10:30', end: '11:00' },
      { slot: 7, start: '11:00', end: '11:30' },
      { slot: 8, start: '11:30', end: '12:00' },
      // Lunch break: 12:00-13:00 (slots 9-10 skipped)
      { slot: 11, start: '13:00', end: '13:30' },
      { slot: 12, start: '13:30', end: '14:00' },
      { slot: 13, start: '14:00', end: '14:30' },
      { slot: 14, start: '14:30', end: '15:00' },
      { slot: 15, start: '15:00', end: '15:30' },
      { slot: 16, start: '15:30', end: '16:00' },
      { slot: 17, start: '16:00', end: '16:30' },
      { slot: 18, start: '16:30', end: '17:00' },
      { slot: 19, start: '17:00', end: '17:30' },
      { slot: 20, start: '17:30', end: '18:00' },
      { slot: 21, start: '18:00', end: '18:30' },
      { slot: 22, start: '18:30', end: '19:00' },
      { slot: 23, start: '19:00', end: '19:30' },
      { slot: 24, start: '19:30', end: '20:00' },
    ];
  }

  /**
   * Get all 24 slots for a specific date with availability status
   */
  static async getSlotsForDate(doctorId, slotDate) {
    const slotTimes = this.generateSlotTimes();

    // Get existing slots from database
    const query = `
      SELECT slot_number, is_available, is_booked
      FROM appointment_slots
      WHERE doctor_id = ? AND slot_date = ?
    `;

    const [dbSlots] = await db.execute(query, [doctorId, slotDate]);

    // Create map of database slot data
    const dbSlotMap = {};
    dbSlots.forEach(slot => {
      dbSlotMap[slot.slot_number] = {
        is_available: slot.is_available,
        is_booked: slot.is_booked,
      };
    });

    // Build complete 24-slot response
    const slots = slotTimes.map(slot => {
      const dbSlotData = dbSlotMap[slot.slot] || { is_available: false, is_booked: false };

      return {
        slotNumber: slot.slot,
        startTime: slot.start,
        endTime: slot.end,
        displayTime: `${this.convertTo12Hour(slot.start)} - ${this.convertTo12Hour(slot.end)}`,
        isAvailable: dbSlotData.is_available,
        isBooked: dbSlotData.is_booked,
      };
    });

    return slots;
  }

  /**
   * Make a slot available
   */
  static async makeSlotAvailable(doctorId, slotDate, slotNumber) {
    const validSlots = [...Array(8).keys()].map(i => i + 1).concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
    if (!validSlots.includes(slotNumber)) {
      throw new Error('Invalid slot number. Valid slots: 1-8, 11-24');
    }

    const upsertQuery = `
      INSERT INTO appointment_slots (doctor_id, slot_date, slot_number, is_available)
      VALUES (?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE is_available = TRUE, updated_at = CURRENT_TIMESTAMP
    `;

    const [result] = await db.execute(upsertQuery, [doctorId, slotDate, slotNumber]);
    return result.affectedRows > 0;
  }

  /**
   * Update single slot availability
   */
  static async updateSlotAvailability(doctorId, slotDate, slotNumber, isAvailable) {
    if (isAvailable) {
      return this.makeSlotAvailable(doctorId, slotDate, slotNumber);
    }

    // Delete slot if making unavailable (default is unavailable)
    const deleteQuery = `
      DELETE FROM appointment_slots
      WHERE doctor_id = ? AND slot_date = ? AND slot_number = ?
    `;

    const [result] = await db.execute(deleteQuery, [doctorId, slotDate, slotNumber]);
    return result.affectedRows > 0;
  }

  /**
   * Update multiple slots
   */
  static async updateMultipleSlots(doctorId, slotDate, slotsData) {
    const availableSlots = slotsData.filter(s => s.isAvailable);
    if (availableSlots.length === 0) {
      throw new Error('At least one slot must be available');
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete all existing slots for this date
      const deleteQuery = `DELETE FROM appointment_slots WHERE doctor_id = ? AND slot_date = ?`;
      await connection.execute(deleteQuery, [doctorId, slotDate]);

      // Insert only available slots
      const insertQuery = `
        INSERT INTO appointment_slots (doctor_id, slot_date, slot_number, is_available)
        VALUES (?, ?, ?, TRUE)
      `;

      for (const slot of availableSlots) {
        await connection.execute(insertQuery, [doctorId, slotDate, slot.slotNumber]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get week schedule
   */
  static async getWeekSchedule(doctorId, startDate) {
    const slotTimes = this.generateSlotTimes();
    const weekSchedule = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const query = `
        SELECT slot_number, is_available
        FROM appointment_slots
        WHERE doctor_id = ? AND slot_date = ?
      `;

      const [dbSlots] = await db.execute(query, [doctorId, dateStr]);

      const dbSlotMap = {};
      dbSlots.forEach(slot => {
        dbSlotMap[slot.slot_number] = slot.is_available;
      });

      const slots = slotTimes.map(slot => ({
        slotNumber: slot.slot,
        displayTime: `${this.convertTo12Hour(slot.start)} - ${this.convertTo12Hour(slot.end)}`,
        isAvailable: dbSlotMap[slot.slot] || false,
      }));

      weekSchedule[dateStr] = slots;
    }

    return weekSchedule;
  }
}

module.exports = AppointmentSlot;
