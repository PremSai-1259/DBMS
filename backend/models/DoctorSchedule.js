const db = require('../configs/db');

class DoctorScheduleModel {
  // Convert 24-hour time to 12-hour AM/PM format
  static convertTo12Hour(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
  }
  // Generate slot time display (8 AM to 9 PM, 30 min each, skip 12-1 PM lunch)
  static generateSlotTimes() {
    const slotDurations = [
      // Morning: 8 AM - 12 PM (slots 1-8)
      { slot: 1, start: '08:00', end: '08:30' },
      { slot: 2, start: '08:30', end: '09:00' },
      { slot: 3, start: '09:00', end: '09:30' },
      { slot: 4, start: '09:30', end: '10:00' },
      { slot: 5, start: '10:00', end: '10:30' },
      { slot: 6, start: '10:30', end: '11:00' },
      { slot: 7, start: '11:00', end: '11:30' },
      { slot: 8, start: '11:30', end: '12:00' },
      // Lunch break: 12 PM - 1 PM (no slots 9-10)
      // Afternoon: 1 PM - 9 PM (slots 11-24)
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
    return slotDurations;
  }

  // Get or create doctor schedule for a specific date
  static async getOrCreateSchedule(doctorId, scheduleDate) {
    const query = `
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = ? AND schedule_date = ?
    `;
    const [rows] = await db.execute(query, [doctorId, scheduleDate]);
    
    if (rows.length > 0) {
      return rows[0];
    }

    // Create new schedule with all slots defaulting to unavailable (FALSE)
    const insertQuery = `
      INSERT INTO doctor_schedules (doctor_id, schedule_date)
      VALUES (?, ?)
    `;
    await db.execute(insertQuery, [doctorId, scheduleDate]);
    
    // Fetch and return the created schedule
    const [newRows] = await db.execute(query, [doctorId, scheduleDate]);
    return newRows[0];
  }

  // Get all slots for a date with their availability status
  static async getSlotsForDate(doctorId, scheduleDate) {
    const schedule = await this.getOrCreateSchedule(doctorId, scheduleDate);
    const slotTimes = this.generateSlotTimes();

    const slots = slotTimes.map(slot => ({
      slotNumber: slot.slot,
      startTime: slot.start,
      endTime: slot.end,
      displayTime: `${this.convertTo12Hour(slot.start)} - ${this.convertTo12Hour(slot.end)}`,
      isAvailable: schedule[`slot_${slot.slot}`] || false,
    }));

    return slots;
  }

  // Update single slot availability
  static async updateSlotAvailability(doctorId, scheduleDate, slotNumber, isAvailable) {
    const schedule = await this.getOrCreateSchedule(doctorId, scheduleDate);
    
    const updateQuery = `
      UPDATE doctor_schedules 
      SET slot_${slotNumber} = ?
      WHERE doctor_id = ? AND schedule_date = ?
    `;
    
    const [result] = await db.execute(updateQuery, [isAvailable ? 1 : 0, doctorId, scheduleDate]);
    return result.affectedRows > 0;
  }

  // Update multiple slots at once
  static async updateMultipleSlots(doctorId, scheduleDate, slotsData) {
    // slotsData: { slotNumber: isAvailable, ... }
    const schedule = await this.getOrCreateSchedule(doctorId, scheduleDate);
    
    let updates = [];
    for (const [slotNumber, isAvailable] of Object.entries(slotsData)) {
      updates.push(`slot_${slotNumber} = ${isAvailable ? 1 : 0}`);
    }

    if (updates.length === 0) return true;

    const updateQuery = `
      UPDATE doctor_schedules 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE doctor_id = ? AND schedule_date = ?
    `;
    
    const [result] = await db.execute(updateQuery, [doctorId, scheduleDate]);
    return result.affectedRows > 0;
  }

  // Get schedules for a date range
  static async getScheduleRange(doctorId, startDate, endDate) {
    const query = `
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = ? AND schedule_date BETWEEN ? AND ?
      ORDER BY schedule_date ASC
    `;
    const [rows] = await db.execute(query, [doctorId, startDate, endDate]);
    return rows;
  }

  // Get all slots for a week
  static async getWeekSchedule(doctorId, startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const schedules = await this.getScheduleRange(
      doctorId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const slotTimes = this.generateSlotTimes();
    const weekSchedule = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const schedule = schedules.find(s => s.schedule_date === dateStr);
      
      weekSchedule[dateStr] = slotTimes.map(slot => ({
        slotNumber: slot.slot,
        displayTime: `${this.convertTo12Hour(slot.start)} - ${this.convertTo12Hour(slot.end)}`,
        isAvailable: schedule ? schedule[`slot_${slot.slot}`] : false,
      }));
    }

    return weekSchedule;
  }
}

module.exports = DoctorScheduleModel;
