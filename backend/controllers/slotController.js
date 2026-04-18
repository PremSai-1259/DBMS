const AppointmentSlotModel = require('../models/AppointmentSlot');
const DoctorProfileModel = require('../models/DoctorProfile');

class SlotController {
  static async generateSlots(req, res) {
    try {
      const doctorId = req.user.id;
      const { slotDate } = req.body;

      // Validation
      if (!slotDate) {
        return res.status(400).json({ error: 'slotDate required (YYYY-MM-DD format)' });
      }

      // Verify doctor is approved
      const isVerified = await DoctorProfileModel.isVerified(doctorId);
      if (!isVerified) {
        return res.status(403).json({ error: 'Doctor profile must be verified before generating slots' });
      }

      // Check if slots already exist for this date
      const existing = await AppointmentSlotModel.getSlotsByDoctorAndDate(doctorId, slotDate);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Slots already exist for this date' });
      }

      // Generate 24 slots
      const result = await AppointmentSlotModel.generateSlots(doctorId, slotDate);

      res.status(201).json({
        message: 'Slots generated successfully',
        slotDate,
        slotsCreated: result.slotsCreated,
        slots: '1-24'
      });
    } catch (error) {
      console.error('Generate slots error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getSlots(req, res) {
    try {
      const { doctorId, slotDate } = req.query;

      // Validation
      if (!doctorId || !slotDate) {
        return res.status(400).json({ error: 'doctorId and slotDate required' });
      }

      // Get slots
      const slots = await AppointmentSlotModel.getSlotsByDoctorAndDate(doctorId, slotDate);

      res.json({
        slotDate,
        total: slots.length,
        slots: slots.map(slot => ({
          id: slot.id,
          slotNumber: slot.slot_number,
          isBooked: slot.is_booked,
          isActive: slot.is_active
        }))
      });
    } catch (error) {
      console.error('Get slots error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAvailableSlots(req, res) {
    try {
      const { doctorId, slotDate } = req.query;

      // If no parameters, return all available slots with doctor info
      if (!doctorId && !slotDate) {
        const slots = await AppointmentSlotModel.getAllAvailableSlotsWithDoctors();
        return res.json(slots);
      }

      // If parameters provided, validate both are present
      if (!doctorId || !slotDate) {
        return res.status(400).json({ error: 'doctorId and slotDate required' });
      }

      // Get available slots for specific doctor and date
      const slots = await AppointmentSlotModel.getAvailableSlots(doctorId, slotDate);

      res.json({
        slotDate,
        available: slots.length,
        slots: slots.map(slot => ({
          id: slot.id,
          slotNumber: slot.slot_number
        }))
      });
    } catch (error) {
      console.error('Get available slots error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SlotController;
