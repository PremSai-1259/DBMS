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
      const doctorId = req.user?.id;
      const { scheduleDate, slots } = req.body;

      console.log(`🔍 Received save request:`, {
        doctorId,
        scheduleDate,
        slotsReceived: slots,
        slotsType: typeof slots,
        slotsIsArray: Array.isArray(slots)
      });

      // Validate doctorId
      if (!doctorId) {
        console.error('❌ No doctorId in req.user:', req.user);
        return res.status(401).json({ 
          error: 'Authentication required - no doctor ID found' 
        });
      }

      // Validate date
      if (!scheduleDate) {
        console.error('❌ Missing scheduleDate');
        return res.status(400).json({ 
          error: 'scheduleDate is required (format: YYYY-MM-DD)' 
        });
      }

      // Validate slots
      if (!slots) {
        console.error('❌ Missing slots');
        return res.status(400).json({ 
          error: 'slots is required' 
        });
      }

      if (!Array.isArray(slots)) {
        console.error('❌ slots is not an array:', slots);
        return res.status(400).json({ 
          error: `slots must be an array, received ${typeof slots}` 
        });
      }

      if (slots.length === 0) {
        console.error('❌ slots array is empty');
        return res.status(400).json({ 
          error: 'At least one slot must be provided' 
        });
      }

      // Validate slot numbers and format
      let formattedSlots = [];
      for (const slot of slots) {
        const slotNumber = slot?.slotNumber || slot?.slot;
        if (slotNumber === undefined || slotNumber === null) {
          console.error('❌ Slot missing slotNumber/slot:', slot);
          return res.status(400).json({ 
            error: `Invalid slot format: missing slotNumber. Received: ${JSON.stringify(slot)}` 
          });
        }

        const num = parseInt(slotNumber);
        
        if (isNaN(num)) {
          console.error('❌ Invalid slot number (NaN):', slotNumber);
          return res.status(400).json({ 
            error: `Invalid slot number: ${slotNumber} (not a number)` 
          });
        }

        if (num < 1 || num > 24) {
          console.error('❌ Slot number out of range:', num);
          return res.status(400).json({ 
            error: `Invalid slot number: ${num}. Valid range: 1-24` 
          });
        }

        if ([9, 10].includes(num)) {
          console.error('❌ Slot is lunch break:', num);
          return res.status(400).json({ 
            error: `Slot ${num} is during lunch break (12 PM - 1 PM) and cannot be set` 
          });
        }
        
        const isAvail = Boolean(slot.isAvailable);
        formattedSlots.push({
          slotNumber: num,
          isAvailable: isAvail
        });
      }

      console.log(`✅ Formatted slots:`, formattedSlots);

      // Check if at least one slot is being set to available
      const hasAvailableSlot = formattedSlots.some(s => s.isAvailable === true);
      if (!hasAvailableSlot) {
        console.warn('⚠️ No available slots in request');
        return res.status(400).json({ 
          error: 'At least one slot must be set as available' 
        });
      }

      console.log(`📅 [${new Date().toISOString()}] Doctor ${doctorId} updating schedule for ${scheduleDate}`);
      console.log(`📋 Saving ${formattedSlots.filter(s => s.isAvailable).length} available slots`);

      const success = await AppointmentSlot.updateMultipleSlots(
        doctorId,
        scheduleDate,
        formattedSlots
      );

      if (!success) {
        console.error('❌ updateMultipleSlots returned false');
        return res.status(500).json({ error: 'Failed to update slots' });
      }

      const availableSlots = formattedSlots.filter(s => s.isAvailable);
      const response = {
        success: true,
        message: `Schedule saved successfully!`,
        scheduleDate,
        totalSlotsUpdated: availableSlots.length,
        slotsAvailable: availableSlots.map(s => s.slotNumber),
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Schedule save successful:`, response);
      res.json(response);

    } catch (error) {
      console.error('❌ Update multiple slots error:');
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      
      // If it's a validation-related error, return 400
      if (error.message.includes('validation') || error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({ 
          error: error.message
        });
      }
      
      // Otherwise, it's a server error
      res.status(500).json({ 
        error: 'Failed to save schedule: ' + error.message
      });
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
