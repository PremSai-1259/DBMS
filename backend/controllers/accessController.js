const RecordAccessModel = require('../models/RecordAccess');
const FileModel = require('../models/File');
const UserModel = require('../models/User');
const NotificationModel = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/helpers');

class AccessController {
  static async requestAccess(req, res) {
    try {
      const doctorId = req.user.id;
      const { patientId, fileId } = req.body;

      // Validation
      if (!patientId || !fileId) {
        return res.status(400).json({ error: 'patientId and fileId required' });
      }

      // Get file
      const file = await FileModel.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Verify file belongs to patient
      if (file.user_id !== patientId) {
        return res.status(403).json({ error: 'File does not belong to this patient' });
      }

      // Check if request already exists
      const hasExisting = await RecordAccessModel.hasExistingRequest(patientId, doctorId, fileId);
      if (hasExisting) {
        return res.status(409).json({ error: 'Access request already pending' });
      }

      // Create request
      const requestId = await RecordAccessModel.createRequest(patientId, doctorId, fileId);

      // Create notification for patient
      const doctor = await UserModel.findById(doctorId);
      await NotificationModel.create(patientId, 'access_requested', 
        `Dr. ${doctor.name} requested access to your medical record`);

      res.status(201).json({
        message: 'Access request created',
        requestId
      });
    } catch (error) {
      console.error('Request access error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAccessRequests(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log(`\n[ACCESS-CONTROLLER] userId=${userId}, role=${userRole}`);

      let requests;

      if (userRole === 'patient') {
        // Requests TO patient for their files
        requests = await RecordAccessModel.findByPatientId(userId);
        console.log(`[ACCESS-CONTROLLER] Patient: calling findByPatientId(${userId})`);
      } else if (userRole === 'doctor') {
        // Requests FROM doctor for patient files
        console.log(`[ACCESS-CONTROLLER] Doctor: calling findByDoctorId(${userId})`);
        requests = await RecordAccessModel.findByDoctorId(userId);
      } else {
        return res.status(403).json({ error: 'Invalid role' });
      }

      console.log(`[ACCESS-CONTROLLER] Found ${requests.length} requests`);
      console.log(`[ACCESS-CONTROLLER] Raw requests:`, requests);

      const mappedRequests = requests.map(r => ({
        id: r.id,
        doctorId: r.doctor_id,
        doctorName: r.doctor_name,
        patientId: r.patient_id,
        patientName: r.patient_name,
        fileName: r.file_name,
        status: r.status,
        requestedAt: r.requested_at,
        updatedAt: r.updated_at,
        expiresAt: r.expires_at
      }));

      console.log(`[ACCESS-CONTROLLER] Mapped requests:`, mappedRequests);

      res.json({
        total: mappedRequests.length,
        requests: mappedRequests
      });
    } catch (error) {
      console.error('Get access requests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async respondToRequest(req, res) {
    try {
      const patientId = req.user.id;
      const { requestId } = req.params;
      const { status, expiresAt } = req.body;

      // Validation
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'status must be "approved" or "rejected"' });
      }

      // Get request
      const request = await RecordAccessModel.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Verify patient owns the file
      if (request.patient_id !== patientId) {
        return res.status(403).json({ error: 'You can only respond to requests for your own files' });
      }

      // Verify status is pending
      if (request.status !== 'pending') {
        return res.status(400).json({ error: `Request is already ${request.status}` });
      }

      const doctorId = request.doctor_id;
      const doctor = await UserModel.findById(doctorId);

      if (status === 'approved') {
        // Approve access
        await RecordAccessModel.approve(requestId, expiresAt || null);

        // Send email to doctor
        const emailTemplate = emailTemplates.accessApproved(
          (await UserModel.findById(patientId)).name, 
          doctor.name
        );
        await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);

        // Create notification for doctor
        await NotificationModel.create(doctorId, 'access_granted', 
          'Access to medical record approved');
      } else {
        // Reject access
        await RecordAccessModel.reject(requestId);

        // Send email to doctor
        const emailTemplate = emailTemplates.accessRejected(
          (await UserModel.findById(patientId)).name,
          doctor.name
        );
        await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);

        // Create notification for doctor
        await NotificationModel.create(doctorId, 'access_denied', 
          'Access to medical record was denied');
      }

      res.json({
        message: `Access request ${status}`,
        requestId,
        status
      });
    } catch (error) {
      console.error('Respond to request error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async revokeAccess(req, res) {
    try {
      const patientId = req.user.id;
      const { requestId } = req.params;

      // Get request
      const request = await RecordAccessModel.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Verify patient owns the file
      if (request.patient_id !== patientId) {
        return res.status(403).json({ error: 'You can only revoke access for your own files' });
      }

      // Verify it was approved
      if (request.status !== 'approved') {
        return res.status(400).json({ error: 'Can only revoke approved access' });
      }

      // Revoke access
      await RecordAccessModel.revoke(requestId);

      // Create notification for doctor
      await NotificationModel.create(request.doctor_id, 'access_revoked', 
        'Your access to a medical record has been revoked');

      res.json({
        message: 'Access revoked successfully',
        requestId
      });
    } catch (error) {
      console.error('Revoke access error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AccessController;
