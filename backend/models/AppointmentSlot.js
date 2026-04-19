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
      SELECT slot_number, is_available, is_booked, slot_start_time, slot_end_time
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
        slot_start_time: slot.slot_start_time,
        slot_end_time: slot.slot_end_time,
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

    // Get the slot time info
    const slotTimes = this.generateSlotTimes();
    const slotInfo = slotTimes.find(s => s.slot === slotNumber);

    if (!slotInfo) {
      throw new Error(`Slot ${slotNumber} time information not found`);
    }

    const upsertQuery = `
      INSERT INTO appointment_slots (
        doctor_id, 
        slot_date, 
        slot_number, 
        slot_start_time,
        slot_end_time,
        is_available
      )
      VALUES (?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE 
        is_available = TRUE, 
        slot_start_time = VALUES(slot_start_time),
        slot_end_time = VALUES(slot_end_time),
        updated_at = CURRENT_TIMESTAMP
    `;

    const [result] = await db.execute(upsertQuery, [
      doctorId, 
      slotDate, 
      slotNumber,
      slotInfo.start,
      slotInfo.end
    ]);
    
    console.log(`✅ Slot ${slotNumber} (${slotInfo.start}-${slotInfo.end}) made available`);
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
   * Update multiple slots - Store all slot details when doctor saves changes
   */
  static async updateMultipleSlots(doctorId, slotDate, slotsData) {
    console.log(`📋 updateMultipleSlots called:`, {
      doctorId,
      slotDate,
      totalSlots: slotsData.length,
      slots: slotsData
    });

    const availableSlots = slotsData.filter(s => s.isAvailable);
    console.log(`✅ Available slots to save:`, availableSlots);

    if (availableSlots.length === 0) {
      console.error('❌ No available slots in request');
      throw new Error('At least one slot must be available');
    }

    // Get slot times for reference
    const slotTimes = this.generateSlotTimes();
    const slotTimeMap = {};
    slotTimes.forEach(slot => {
      slotTimeMap[slot.slot] = { start: slot.start, end: slot.end };
    });

    let connection;
    try {
      console.log('🔌 DB object type:', typeof db);
      console.log('🔌 DB object keys:', Object.keys(db || {}));
      console.log('🔌 typeof db.getConnection:', typeof db?.getConnection);
      console.log('🔌 Getting database connection...');
      connection = await db.getConnection();
      console.log('🔌 Connection acquired, starting transaction...');
      
      await connection.beginTransaction();
      console.log('🔄 Transaction started');

      // Delete all existing slots for this date
      const deleteQuery = `DELETE FROM appointment_slots WHERE doctor_id = ? AND slot_date = ?`;
      console.log(`🗑️ Executing delete query:`, {
        doctorId,
        slotDate
      });
      
      const deleteResult = await connection.execute(deleteQuery, [doctorId, slotDate]);
      console.log(`🗑️ Delete result:`, deleteResult[0]);

      // Insert only available slots with complete details
      const insertQuery = `
        INSERT INTO appointment_slots (
          doctor_id, 
          slot_date, 
          slot_number, 
          slot_start_time,
          slot_end_time,
          is_available, 
          is_booked
        )
        VALUES (?, ?, ?, ?, ?, TRUE, FALSE)
      `;

      let insertedCount = 0;
      for (const slot of availableSlots) {
        const slotNum = slot.slotNumber;
        const timeInfo = slotTimeMap[slotNum];
        
        if (!timeInfo) {
          console.warn(`⚠️ Invalid slot number: ${slotNum}, skipping...`);
          continue;
        }

        console.log(`📤 Inserting slot:`, {
          doctorId,
          slotDate,
          slotNum,
          startTime: timeInfo.start,
          endTime: timeInfo.end
        });

        const insertResult = await connection.execute(insertQuery, [
          doctorId, 
          slotDate, 
          slotNum,
          timeInfo.start,
          timeInfo.end,
        ]);
        
        console.log(`✅ Insert result for slot ${slotNum}:`, insertResult[0]);
        insertedCount++;
        console.log(`✅ Slot ${slotNum} (${timeInfo.start}-${timeInfo.end}) saved for ${slotDate}`);
      }

      console.log(`💾 All inserts complete, committing transaction...`);
      await connection.commit();
      console.log(`📝 Transaction committed. Saved ${insertedCount} available slots for doctor ${doctorId} on ${slotDate}`);
      return true;
    } catch (error) {
      console.error('❌ Error in updateMultipleSlots:', error);
      if (connection) {
        try {
          console.log('🔙 Rolling back transaction...');
          await connection.rollback();
          console.error('🔙 Transaction rolled back due to error:', error.message);
        } catch (rollbackError) {
          console.error('❌ Rollback error:', rollbackError);
        }
      }
      throw error;
    } finally {
      if (connection) {
        try {
          console.log('🔌 Releasing connection...');
          await connection.release();
          console.log('🔌 Connection released');
        } catch (releaseError) {
          console.error('❌ Error releasing connection:', releaseError);
        }
      }
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

  /**
   * Get all available slots with doctor information
   * Used by patient portal to show list of doctors with available slots
   */
  static async getAllAvailableSlotsWithDoctors() {
    const query = `
      SELECT 
        s.id,
        s.doctor_id as doctorId,
        u.name as doctorName,
        dp.specialization,
        dp.hospital_name as hospitalName,
        s.slot_date as slotDate,
        s.slot_number as slotNumber,
        s.slot_start_time as slotStartTime,
        s.slot_end_time as slotEndTime,
        s.is_available as isAvailable,
        s.is_booked as isBooked
      FROM appointment_slots s
      INNER JOIN doctor_profiles dp ON s.doctor_id = dp.user_id
      INNER JOIN users u ON dp.user_id = u.id
      WHERE s.is_available = TRUE 
        AND s.is_booked = FALSE
        AND s.slot_date >= CURDATE()
      ORDER BY s.slot_date ASC, s.slot_number ASC
    `;

    try {
      const [slots] = await db.execute(query);
      console.log(`✅ Retrieved ${slots.length} available slots with doctor info`);
      return slots;
    } catch (error) {
      console.error('❌ Error fetching available slots with doctors:', error);
      throw error;
    }
  }

  /**
   * Get all available future slots for a specific doctor
   * @param {number} doctorId - Doctor user ID
   * @returns {Promise<Array>} Array of available slots
   */
  static async getAvailableSlotsForDoctor(doctorId) {
    const query = `
      SELECT
        s.id,
        s.doctor_id as doctorId,
        s.slot_date as slotDate,
        s.slot_number as slotNumber,
        s.slot_start_time as slotStartTime,
        s.slot_end_time as slotEndTime,
        s.is_available as isAvailable,
        s.is_booked as isBooked
      FROM appointment_slots s
      WHERE s.doctor_id = ?
        AND s.is_available = TRUE
        AND s.is_booked = FALSE
        AND s.slot_date >= CURDATE()
      ORDER BY s.slot_date ASC, s.slot_number ASC
    `;

    try {
      const [slots] = await db.execute(query, [doctorId]);
      console.log(`✅ Retrieved ${slots.length} available slots for doctor ${doctorId}`);
      return slots;
    } catch (error) {
      console.error(`❌ Error fetching slots for doctor ${doctorId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific slot by ID
   * @param {number} slotId - Slot ID
   * @returns {Promise<Object>} Slot details or null if not found
   */
  static async getSlotById(slotId) {
    const query = `
      SELECT 
        s.id,
        s.doctor_id as doctor_id,
        s.slot_date as slot_date,
        s.slot_number as slot_number,
        s.slot_start_time as slot_start_time,
        s.slot_end_time as slot_end_time,
        s.is_available as is_available,
        s.is_booked as is_booked
      FROM appointment_slots s
      WHERE s.id = ?
    `;

    try {
      const [slots] = await db.execute(query, [slotId]);
      if (slots.length === 0) return null;
      console.log(`✅ Retrieved slot ${slotId}:`, slots[0]);
      return slots[0];
    } catch (error) {
      console.error(`❌ Error fetching slot ${slotId}:`, error);
      throw error;
    }
  }

  /**
   * Mark a slot as booked
   * @param {number} slotId - Slot ID
   * @returns {Promise<boolean>} True if successfully booked
   */
  static async markAsBooked(slotId) {
    const query = `
      UPDATE appointment_slots 
      SET is_booked = TRUE, is_available = FALSE
      WHERE id = ?
    `;

    try {
      const result = await db.execute(query, [slotId]);
      console.log(`✅ Slot ${slotId} marked as booked`);
      return true;
    } catch (error) {
      console.error(`❌ Error marking slot ${slotId} as booked:`, error);
      throw error;
    }
  }
}

module.exports = AppointmentSlot;
