const AppointmentSlot = require('../models/AppointmentSlot');
const DoctorProfileModel = require('../models/DoctorProfile');

class ScheduleController {
  // Get all 24 slots for a specific date
  static async getSlotsForDate(req, res) {
    try {
      const doctorId = req.user?.id || req.query.doctorId;
      const { scheduleDate } = req.query;

      console.log(`📅 Schedule Request - Doctor ID: ${doctorId}, Date: ${scheduleDate}`);

      if (!doctorId || !scheduleDate) {
        console.warn('❌ Missing doctorId or scheduleDate');
        return res.status(400).json({ 
          error: 'doctorId and scheduleDate (YYYY-MM-DD) are required' 
        });
      }

      const slots = await AppointmentSlot.getSlotsForDate(doctorId, scheduleDate);
      console.log(`✅ Returning ${slots.length} slots for ${scheduleDate}`);
      
      res.json({
        success: true,
        scheduleDate,
        totalSlots: slots.length,
        slots
      });
    } catch (error) {
      console.error('Get slots error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update availability of a single slot
  static async updateSlotAvailability(req, res) {
    try {
      const doctorId = req.user.id;
      const { scheduleDate, slotNumber, isAvailable } = req.body;

      // Validate
      if (!scheduleDate || !slotNumber || isAvailable === undefined) {
        return res.status(400).json({ 
          error: 'scheduleDate, slotNumber, and isAvailable are required' 
        });
      }

      if (slotNumber < 1 || slotNumber > 24 || [9, 10].includes(slotNumber)) {
        return res.status(400).json({ 
          error: 'Invalid slot number. Valid slots: 1-8 (morning), 11-24 (afternoon)' 
        });
      }

      // Update availability
      const success = await AppointmentSlot.updateSlotAvailability(
        doctorId,
        scheduleDate,
        slotNumber,
        isAvailable
      );

      if (!success) {
        return res.status(500).json({ error: 'Failed to update slot availability' });
      }

      res.json({
        success: true,
        message: `Slot ${slotNumber} updated to ${isAvailable ? 'available' : 'unavailable'}`,
        slotNumber,
        isAvailable
      });
    } catch (error) {
      console.error('Update slot error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update multiple slots at once (bulk update)
  static async updateMultipleSlots(req, res) {
    try {
      const doctorId = req.user.id;
      const { scheduleDate, slots } = req.body;

      if (!scheduleDate || !Array.isArray(slots)) {
        return res.status(400).json({ 
          error: 'scheduleDate and slots array are required' 
        });
      }

      // Validate slot numbers and format
      const formattedSlots = slots.map(slot => {
        const slotNumber = slot.slotNumber || slot.slot;
        const num = parseInt(slotNumber);
        
        if (num < 1 || num > 24 || [9, 10].includes(num)) {
          throw new Error(`Invalid slot number: ${num}`);
        }
        
        return {
          slotNumber: num,
          isAvailable: Boolean(slot.isAvailable)
        };
      });

      // Check if at least one slot is being set to available
      const hasAvailableSlot = formattedSlots.some(s => s.isAvailable === true);
      if (!hasAvailableSlot) {
        return res.status(400).json({ 
          error: 'At least one slot must be set as available' 
        });
      }

      const success = await AppointmentSlot.updateMultipleSlots(
        doctorId,
        scheduleDate,
        formattedSlots
      );

      if (!success) {
        return res.status(500).json({ error: 'Failed to update slots' });
      }

      res.json({
        success: true,
        message: `${formattedSlots.filter(s => s.isAvailable).length} slot(s) updated as available`,
        updatedCount: formattedSlots.filter(s => s.isAvailable).length
      });
    } catch (error) {
      console.error('Update multiple slots error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Get week schedule
  static async getWeekSchedule(req, res) {
    try {
      const doctorId = req.user?.id || req.query.doctorId;
      const { startDate } = req.query;

      if (!doctorId || !startDate) {
        return res.status(400).json({ 
          error: 'doctorId and startDate (YYYY-MM-DD) are required' 
        });
      }

      const start = new Date(startDate);
      const weekSchedule = await AppointmentSlot.getWeekSchedule(doctorId, start);

      res.json({
        success: true,
        weekSchedule,
        dayCount: Object.keys(weekSchedule).length
      });
    } catch (error) {
      console.error('Get week schedule error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get schedule for date range
  static async getScheduleRange(req, res) {
    try {
      const doctorId = req.user?.id || req.query.doctorId;
      const { startDate, endDate } = req.query;

      if (!doctorId || !startDate || !endDate) {
        return res.status(400).json({ 
          error: 'doctorId, startDate, and endDate (YYYY-MM-DD) are required' 
        });
      }

      // Get schedule for each day in range
      const schedules = {};
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const slots = await AppointmentSlot.getSlotsForDate(doctorId, dateStr);
        schedules[dateStr] = slots;
      }

      res.json({
        success: true,
        scheduleCount: Object.keys(schedules).length,
        schedules
      });
    } catch (error) {
      console.error('Get schedule range error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Utility: Get slot time display info
  static async getSlotTimes(req, res) {
    try {
      const slots = AppointmentSlot.generateSlotTimes();
      
      res.json({
        success: true,
        totalSlots: slots.length,
        slots,
        info: {
          morning: '8:00 AM - 12:00 PM (slots 1-8)',
          breakTime: '12:00 PM - 1:00 PM (no slots 9-10)',
          afternoon: '1:00 PM - 9:00 PM (slots 11-24)',
          slotDuration: '30 minutes each'
        }
      });
    } catch (error) {
      console.error('Get slot times error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ScheduleController;
