const AppointmentModel = require('../models/Appointment');
const AppointmentSlotModel = require('../models/AppointmentSlot');
const PatientProfileModel = require('../models/PatientProfile');
const DoctorProfileModel = require('../models/DoctorProfile');
const UserModel = require('../models/User');
const NotificationModel = require('../models/Notification');
const FileModel = require('../models/File');
const RecordAccessModel = require('../models/RecordAccess');
const { sendEmail, emailTemplates } = require('../utils/helpers');

class AppointmentController {
  static async bookAppointment(req, res) {
    try {
      const patientId = req.user.id;
      const { doctorId, slotId } = req.body;

      console.log(`📞 [bookAppointment] Patient ${patientId} requesting slot ${slotId} for doctor ${doctorId}`);

      // Validation
      if (!slotId) {
        console.log(`❌ [bookAppointment] Missing slotId`);
        return res.status(400).json({ error: 'slotId required' });
      }

      // PATIENT RESTRICTION: Check if patient profile exists
      const patientProfile = await PatientProfileModel.findByUserId(patientId);
      if (!patientProfile) {
        console.log(`❌ [bookAppointment] Patient ${patientId} profile not found`);
        return res.status(400).json({ error: 'Patient profile must be created first' });
      }

      // Get slot details
      const slot = await AppointmentSlotModel.getSlotById(slotId);
      console.log(`🔍 [bookAppointment] Retrieved slot:`, slot);
      if (!slot) {
        console.log(`❌ [bookAppointment] Slot ${slotId} not found`);
        return res.status(404).json({ error: 'Slot not found' });
      }

      // Source of truth is slot.doctor_id. doctorId in request is optional.
      const resolvedDoctorId = Number(slot.doctor_id);

      // Validate slot belongs to doctor
      if (doctorId && Number(doctorId) !== resolvedDoctorId) {
        console.log(`❌ [bookAppointment] Slot doctor_id ${slot.doctor_id} != requested doctor ${doctorId}`);
        return res.status(400).json({ error: 'Slot does not belong to this doctor' });
      }

      // Validate slot is available
      console.log(`🔎 [bookAppointment] Checking availability: is_available=${slot.is_available}, is_booked=${slot.is_booked}`);
      if (!slot.is_available || slot.is_booked) {
        console.log(`❌ [bookAppointment] Slot not available (is_available=${slot.is_available}, is_booked=${slot.is_booked})`);
        return res.status(400).json({ error: 'Slot is not available' });
      }

      // Prevent double booking
      const isDuplicate = await AppointmentModel.checkDuplicateBooking(patientId, slotId);
      if (isDuplicate) {
        return res.status(409).json({ error: 'You already have a booking for this slot' });
      }

      // Create appointment
      const appointmentId = await AppointmentModel.create(patientId, resolvedDoctorId, slotId);

      // Mark slot as booked
      await AppointmentSlotModel.markAsBooked(slotId);

      // Create notification for patient
      await NotificationModel.create(patientId, 'appointment_booked', 
        'Your appointment has been confirmed');

      // Create notification for doctor
      const patient = await UserModel.findById(patientId);
      await NotificationModel.create(resolvedDoctorId, 'appointment_booked', 
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
      const userId = Number(req.user.id);
      const userRole = String(req.user.role || '').toLowerCase();
      const { appointmentId } = req.params;
      const { cancelReason } = req.body || {};
      const reasonText = cancelReason && String(cancelReason).trim()
        ? String(cancelReason).trim()
        : 'No reason provided';

      // Get appointment
      const appointment = await AppointmentModel.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Check if already cancelled
      if (appointment.status === 'cancelled') {
        return res.status(400).json({ error: 'Appointment is already cancelled' });
      }

      const patient = await UserModel.findById(appointment.patient_id);
      const doctor = await UserModel.findById(appointment.doctor_id);
      const patientName = patient?.name || 'Patient';
      const patientEmail = patient?.email || null;
      const doctorName = doctor?.name || 'Doctor';
      const doctorEmail = doctor?.email || null;

      if (userRole === 'doctor') {
        // Verify doctor ownership
        if (Number(appointment.doctor_id) !== userId) {
          return res.status(403).json({ error: 'Only the assigned doctor can cancel this appointment' });
        }

        // DOCTOR RESTRICTION: Verify doctor is verified
        const isVerified = await DoctorProfileModel.isVerified(userId);
        if (!isVerified) {
          return res.status(403).json({ error: 'Only verified doctors can cancel appointments' });
        }

        // Cancel appointment
        await AppointmentModel.cancel(appointmentId, reasonText);

        // Mark the slot unavailable so nobody else can book the cancelled time
        await AppointmentSlotModel.markAsUnavailable(appointment.slot_id);

        // Side effects should not block cancellation success
        try {
          if (patientEmail) {
            const emailTemplate = emailTemplates.appointmentCancelled(patientName, doctorName, reasonText);
            await sendEmail(patientEmail, emailTemplate.subject, emailTemplate.html);
          }

          await NotificationModel.create(
            appointment.patient_id,
            'appointment_cancelled',
            `Your appointment has been cancelled. Reason: ${reasonText}`
          );
        } catch (sideEffectError) {
          console.warn('Doctor cancel side effect failed:', sideEffectError);
        }

        return res.json({
          message: 'Appointment cancelled successfully',
          appointmentId
        });
      }

      if (userRole === 'patient') {
        // Verify patient ownership
        if (Number(appointment.patient_id) !== userId) {
          return res.status(403).json({ error: 'Only the booked patient can cancel this appointment' });
        }

        if (appointment.status === 'completed') {
          return res.status(400).json({ error: 'Completed appointments cannot be cancelled' });
        }

        // Cancel appointment
        await AppointmentModel.cancel(appointmentId, reasonText);

        // Restore slot availability for other patients
        await AppointmentSlotModel.markAsAvailable(appointment.slot_id);

        // Notify the doctor
        try {
          if (doctorEmail) {
            const emailTemplate = emailTemplates.appointmentCancelledByPatient(patientName, doctorName, reasonText);
            await sendEmail(doctorEmail, emailTemplate.subject, emailTemplate.html);
          }

          await NotificationModel.create(
            appointment.doctor_id,
            'appointment_cancelled_by_patient',
            `${patientName} cancelled the appointment. Reason: ${reasonText}`
          );
        } catch (sideEffectError) {
          console.warn('Patient cancel side effect failed:', sideEffectError);
        }

        return res.json({
          message: 'Appointment cancelled successfully',
          appointmentId
        });
      }

      return res.status(403).json({ error: 'Invalid role' });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAppointments(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log(`Fetching appointments for userId: ${userId}, role: ${userRole}`);

      let appointments = [];

      if (userRole === 'patient') {
        appointments = await AppointmentModel.findByPatientId(userId);
      } else if (userRole === 'doctor') {
        appointments = await AppointmentModel.findByDoctorId(userId);
      } else {
        return res.status(403).json({ error: 'Invalid role' });
      }

      console.log(`Found ${appointments.length} appointments for user ${userId}`);

      res.json({
        total: appointments.length,
        appointments: appointments.map(a => ({
          id: a.id,
          patientId: a.patient_id || null,
          doctorId: a.doctor_id || null,
          doctorName: a.doctor_name || a.patient_name,
          patientName: a.patient_name || null,
          patientEmail: a.patient_email || null,
          doctorEmail: a.doctor_email || null,
          slotDate: a.slot_date,
          slotNumber: a.slot_number,
          slotStartTime: a.slot_start_time,
          slotEndTime: a.slot_end_time,
          consultationId: a.consultation_id || null,
          reasonForVisit: a.reason_for_visit || '',
          diagnosis: a.diagnosis || '',
          prescription: a.prescription || '',
          additionalNotes: a.additional_notes || '',
          consultationCreatedAt: a.consultation_created_at || null,
          consultationUpdatedAt: a.consultation_updated_at || null,
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
      const userId = Number(req.user.id);

      const appointment = await AppointmentModel.getAppointmentDetails(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      // Verify user has access (patient or doctor of this appointment)
      if (Number(appointment.patient_id) !== userId && Number(appointment.doctor_id) !== userId) {
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

  static async getDoctorPatientSummary(req, res) {
    try {
      const doctorId = req.user.id;
      const { patientId } = req.params;

      const patient = await UserModel.findByIdAndRole(patientId, 'patient');
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const hasRelationship = await AppointmentModel.hasDoctorPatientRelationship(doctorId, patientId);
      if (!hasRelationship) {
        return res.status(403).json({ error: 'You can only view patients who have appointments with you' });
      }

      const patientProfile = await PatientProfileModel.findByUserId(patientId);
      const appointmentHistory = await AppointmentModel.findHistoryByDoctorAndPatient(doctorId, patientId);
      const documents = await FileModel.findMedicalReportsByPatientIdForDoctor(patientId, doctorId);

      res.json({
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          age: patientProfile?.age || null,
          gender: patientProfile?.gender || null,
          phone: patientProfile?.phone || null,
          bloodGroup: patientProfile?.blood_group || null,
        },
        appointmentHistory: appointmentHistory.map(appointment => ({
          id: appointment.id,
          slotDate: appointment.slot_date,
          slotNumber: appointment.slot_number,
          slotStartTime: appointment.slot_start_time,
          slotEndTime: appointment.slot_end_time,
          status: appointment.status,
          cancelReason: appointment.cancel_reason,
          createdAt: appointment.created_at,
        })),
        documents: documents.map(file => ({
          id: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          uploadedAt: file.uploaded_at,
          accessRequestId: file.access_request_id,
          accessStatus: file.access_status || null,
          accessRequestedAt: file.access_requested_at || null,
          accessExpiresAt: file.access_expires_at || null,
        })),
      });
    } catch (error) {
      console.error('Get doctor patient summary error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getDoctorProfileWithHistory(req, res) {
    try {
      const patientId = req.user.id;
      const { doctorId } = req.params;

      // Get doctor info
      const doctor = await UserModel.findByIdAndRole(doctorId, 'doctor');
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      // Get doctor profile
      const doctorProfile = await DoctorProfileModel.findByUserId(doctorId);
      if (!doctorProfile) {
        return res.status(404).json({ error: 'Doctor profile not found' });
      }

      // Verify patient has either:
      // 1. An appointment with this doctor, OR
      // 2. A medical request from this doctor
      const hasAppointment = await AppointmentModel.hasDoctorPatientRelationship(doctorId, patientId);
      const hasAccessRequest = await RecordAccessModel.hasAccessRequest(doctorId, patientId);
      
      if (!hasAppointment && !hasAccessRequest) {
        return res.status(403).json({ error: 'You can only view doctors who have appointments or requests with you' });
      }

      // Get appointment history (if any)
      let appointmentHistory = [];
      if (hasAppointment) {
        appointmentHistory = await AppointmentModel.findHistoryByDoctorAndPatient(doctorId, patientId);
      }

      res.json({
        doctor: {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          specialization: doctorProfile.specialization,
          experience: doctorProfile.experience,
          hospitalName: doctorProfile.hospital_name,
          address: doctorProfile.address,
          isVerified: doctorProfile.is_verified,
          rating: doctorProfile.average_rating
        },
        appointmentHistory: appointmentHistory.map(apt => ({
          id: apt.id,
          slotDate: apt.slot_date,
          slotNumber: apt.slot_number,
          slotStartTime: apt.slot_start_time,
          slotEndTime: apt.slot_end_time,
          status: apt.status,
          cancelReason: apt.cancel_reason,
          createdAt: apt.created_at
        }))
      });
    } catch (error) {
      console.error('Get doctor profile with history error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AppointmentController;
