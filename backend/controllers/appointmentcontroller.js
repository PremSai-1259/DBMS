const AppointmentModel = require('../models/Appointment');
const AppointmentSlotModel = require('../models/AppointmentSlot');
const PatientProfileModel = require('../models/PatientProfile');
const DoctorProfileModel = require('../models/DoctorProfile');
const UserModel = require('../models/User');
const NotificationModel = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/helpers');

class AppointmentController {
  static async bookAppointment(req, res) {
    try {
      const patientId = req.user.id;
      const { doctorId, slotId } = req.body;

      // Validation
      if (!doctorId || !slotId) {
        return res.status(400).json({ error: 'doctorId and slotId required' });
      }

      // PATIENT RESTRICTION: Check if patient profile exists
      const patientProfile = await PatientProfileModel.findByUserId(patientId);
      if (!patientProfile) {
        return res.status(400).json({ error: 'Patient profile must be created first' });
      }

      // Get slot details
      const slot = await AppointmentSlotModel.getSlotById(slotId);
      if (!slot) {
        return res.status(404).json({ error: 'Slot not found' });
      }

      // Validate slot belongs to doctor
      if (slot.doctor_id != doctorId) {
        return res.status(400).json({ error: 'Slot does not belong to this doctor' });
      }

      // Validate slot is available
      if (!slot.is_active || slot.is_booked) {
        return res.status(400).json({ error: 'Slot is not available' });
      }

      // Prevent double booking
      const isDuplicate = await AppointmentModel.checkDuplicateBooking(patientId, slotId);
      if (isDuplicate) {
        return res.status(409).json({ error: 'You already have a booking for this slot' });
      }

      // Create appointment
      const appointmentId = await AppointmentModel.create(patientId, doctorId, slotId);

      // Mark slot as booked
      await AppointmentSlotModel.markAsBooked(slotId);

      // Create notification for patient
      await NotificationModel.create(patientId, 'appointment_booked', 
        'Your appointment has been confirmed');

      // Create notification for doctor
      const patient = await UserModel.findById(patientId);
      await NotificationModel.create(doctorId, 'appointment_booked', 
        `New appointment from ${patient.name}`);

      res.status(201).json({
        message: 'Appointment booked successfully',
        appointmentId,
        slotNumber: slot.slot_number,
        slotDate: slot.slot_date
      });
    } catch (error) {
      console.error('Book appointment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async cancelAppointment(req, res) {
    try {
      const doctorId = req.user.id;
      const { appointmentId } = req.params;
      const { cancelReason } = req.body;

      // Validation
      if (!cancelReason) {
        return res.status(400).json({ error: 'cancelReason required' });
      }

      // Get appointment
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Verify doctor ownership
      if (appointment.doctor_id !== doctorId) {
        return res.status(403).json({ error: 'Only the assigned doctor can cancel this appointment' });
      }

      // Check if already cancelled
      if (appointment.status === 'cancelled') {
        return res.status(400).json({ error: 'Appointment is already cancelled' });
      }

      // DOCTOR RESTRICTION: Verify doctor is verified
      const isVerified = await DoctorProfileModel.isVerified(doctorId);
      if (!isVerified) {
        return res.status(403).json({ error: 'Only verified doctors can cancel appointments' });
      }

      // Cancel appointment
      await AppointmentModel.cancel(appointmentId, cancelReason);

      // Mark slot as available
      await AppointmentSlotModel.markAsAvailable(appointment.slot_id);

      // Get patient info
      const patient = await UserModel.findById(appointment.patient_id);
      const doctor = await UserModel.findById(doctorId);

      // Send email to patient
      const emailTemplate = emailTemplates.appointmentCancelled(patient.name, doctor.name, cancelReason);
      await sendEmail(patient.email, emailTemplate.subject, emailTemplate.html);

      // Create notification for patient
      await NotificationModel.create(appointment.patient_id, 'appointment_cancelled', 
        `Your appointment has been cancelled. Reason: ${cancelReason}`);

      res.json({
        message: 'Appointment cancelled successfully',
        appointmentId
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAppointments(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let appointments;

      if (userRole === 'patient') {
        appointments = await AppointmentModel.findByPatientId(userId);
      } else if (userRole === 'doctor') {
        appointments = await AppointmentModel.findByDoctorId(userId);
      } else {
        return res.status(403).json({ error: 'Invalid role' });
      }

      res.json({
        total: appointments.length,
        appointments: appointments.map(a => ({
          id: a.id,
          doctorName: a.doctor_name || a.patient_name,
          slotDate: a.slot_date,
          slotNumber: a.slot_number,
          status: a.status,
          cancelReason: a.cancel_reason
        }))
      });
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAppointmentDetails(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.id;

      const appointment = await AppointmentModel.getAppointmentDetails(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Verify user has access (patient or doctor of this appointment)
      if (appointment.patient_id !== userId && appointment.doctor_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        appointment: {
          id: appointment.id,
          patientName: appointment.patient_name,
          patientEmail: appointment.patient_email,
          doctorName: appointment.doctor_name,
          doctorEmail: appointment.doctor_email,
          slotDate: appointment.slot_date,
          slotNumber: appointment.slot_number,
          status: appointment.status,
          cancelReason: appointment.cancel_reason,
          createdAt: appointment.created_at
        }
      });
    } catch (error) {
      console.error('Get appointment details error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AppointmentController;
