const ConsultationNoteModel = require('../models/ConsultationNote');
const AppointmentModel = require('../models/Appointment');
const UserModel = require('../models/User');

class ConsultationController {
  static async createConsultation(req, res) {
    try {
      const doctorId = req.user.id;
      const { appointmentId, reasonForVisit, diagnosis, prescription, additionalNotes } = req.body;

      // Validation
      if (!appointmentId) {
        return res.status(400).json({ error: 'appointmentId required' });
      }

      // Get appointment
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Verify doctor owns appointment
      if (appointment.doctor_id !== doctorId) {
        return res.status(403).json({ error: 'Only the assigned doctor can write notes' });
      }

      // Check if appointment is completed
      if (appointment.status !== 'completed') {
        return res.status(400).json({ error: 'Appointment must be completed first' });
      }

      // Check if consultation notes already exist
      const existing = await ConsultationNoteModel.findByAppointmentId(appointmentId);
      if (existing) {
        return res.status(409).json({ error: 'Consultation notes already exist for this appointment' });
      }

      // Create notes
      const noteId = await ConsultationNoteModel.create(
        appointmentId,
        doctorId,
        appointment.patient_id,
        reasonForVisit,
        diagnosis,
        prescription,
        additionalNotes
      );

      res.status(201).json({
        message: 'Consultation notes created',
        noteId
      });
    } catch (error) {
      console.error('Create consultation error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getConsultation(req, res) {
    try {
      const userId = req.user.id;
      const { appointmentId } = req.params;

      // Get appointment for verification
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Verify user is doctor or patient of this appointment
      if (appointment.doctor_id !== userId && appointment.patient_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get consultation notes
      const notes = await ConsultationNoteModel.findByAppointmentId(appointmentId);
      if (!notes) {
        return res.status(404).json({ error: 'No consultation notes found' });
      }

      res.json({
        notes
      });
    } catch (error) {
      console.error('Get consultation error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updateConsultation(req, res) {
    try {
      const doctorId = req.user.id;
      const { consultationId } = req.params;
      const { reasonForVisit, diagnosis, prescription, additionalNotes } = req.body;

      // Get consultation
      const consultation = await ConsultationNoteModel.findById(consultationId);
      if (!consultation) {
        return res.status(404).json({ error: 'Consultation notes not found' });
      }

      // Verify doctor ownership
      if (consultation.doctor_id !== doctorId) {
        return res.status(403).json({ error: 'Only the doctor who created notes can update' });
      }

      // Update notes
      await ConsultationNoteModel.update(
        consultationId,
        reasonForVisit,
        diagnosis,
        prescription,
        additionalNotes
      );

      res.json({
        message: 'Consultation notes updated',
        consultationId
      });
    } catch (error) {
      console.error('Update consultation error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ConsultationController;
