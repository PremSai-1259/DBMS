const DoctorApprovalModel = require('../models/DoctorApproval');
const DoctorProfileModel = require('../models/DoctorProfile');
const UserModel = require('../models/User');
const NotificationModel = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/helpers');

class DoctorApprovalController {
  static async requestApproval(req, res) {
    try {
      const doctorId = req.user.id;
      const { certificateFileId } = req.body;

      // Validation
      if (!certificateFileId) {
        return res.status(400).json({ error: 'certificateFileId required' });
      }

      // Check if doctor profile exists
      const doctorProfile = await DoctorProfileModel.findByUserId(doctorId);
      if (!doctorProfile) {
        return res.status(400).json({ error: 'Doctor profile must be created first' });
      }

      // Check if already has pending or approved request (UNIQUE constraint)
      const existing = await DoctorApprovalModel.findByDoctorId(doctorId);
      if (existing && existing.status === 'pending') {
        return res.status(409).json({ error: 'You already have a pending approval request' });
      }
      if (existing && existing.status === 'approved') {
        return res.status(409).json({ error: 'Your doctor profile is already approved' });
      }

      // Create approval request
      const approvalId = await DoctorApprovalModel.create(doctorId, certificateFileId);

      // Update doctor profile with certificate file ID
      await DoctorProfileModel.updateProfile(doctorId, { certificateFileId });

      res.status(201).json({
        message: 'Doctor approval request submitted',
        approvalId
      });
    } catch (error) {
      console.error('Request approval error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getPendingDoctors(req, res) {
    try {
      // Admin only - checked by roleMiddleware
      const pending = await DoctorApprovalModel.findPendingApprovals();

      // Enrich with user and doctor profile data
      const enrichedPending = await Promise.all(pending.map(async (approval) => {
        try {
          const user = await UserModel.findById(approval.doctor_id);
          const doctorProfile = await DoctorProfileModel.findByUserId(approval.doctor_id);
          
          return {
            approvalId: approval.id,
            status: approval.status,
            createdAt: approval.created_at,
            reviewedAt: approval.reviewed_at,
            certificateFileId: approval.certificate_file_id,
            doctor: {
              id: approval.doctor_id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown',
              specialization: doctorProfile?.specialization || 'N/A',
              experience: doctorProfile?.experience || 0,
              hospitalName: doctorProfile?.hospital_name || 'N/A',
              address: doctorProfile?.address || 'N/A',
              verified: doctorProfile?.verified || false
            }
          }
        } catch (error) {
          console.error('Error enriching approval data:', error);
          return approval;
        }
      }));

      res.json({
        pending: enrichedPending,
        count: enrichedPending.length
      });
    } catch (error) {
      console.error('Get pending doctors error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async approveDoctorRequest(req, res) {
    try {
      const { approvalId } = req.params;

      // Find approval
      const approval = await DoctorApprovalModel.findById(approvalId);
      if (!approval) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      if (approval.status !== 'pending') {
        return res.status(400).json({ error: `Request is already ${approval.status}` });
      }

      const doctorId = approval.doctor_id;

      // Mark doctor as verified
      await DoctorProfileModel.setVerified(doctorId, true);

      // Update approval status
      await DoctorApprovalModel.approve(approvalId, doctorId);

      // Get doctor info
      const doctor = await UserModel.findById(doctorId);

      // Send email
      const emailTemplate = emailTemplates.doctorApproved(doctor.name);
      await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);

      // Create notification
      await NotificationModel.create(doctorId, 'doctor_approved', 
        'Your doctor profile has been approved. You can now generate slots and accept appointments.');

      res.json({
        message: 'Doctor approved successfully',
        doctor: { id: doctorId, name: doctor.name, email: doctor.email }
      });
    } catch (error) {
      console.error('Approve doctor error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async rejectDoctorRequest(req, res) {
    try {
      const { approvalId } = req.params;
      const { adminMessage } = req.body;

      // Validation
      if (!adminMessage) {
        return res.status(400).json({ error: 'adminMessage required' });
      }

      // Find approval
      const approval = await DoctorApprovalModel.findById(approvalId);
      if (!approval) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      if (approval.status !== 'pending') {
        return res.status(400).json({ error: `Request is already ${approval.status}` });
      }

      const doctorId = approval.doctor_id;

      // Update approval status with message
      await DoctorApprovalModel.reject(approvalId, doctorId, adminMessage);

      // Get doctor info
      const doctor = await UserModel.findById(doctorId);

      // Send email
      const emailTemplate = emailTemplates.doctorRejected(doctor.name, adminMessage);
      await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);

      // Create notification
      await NotificationModel.create(doctorId, 'doctor_rejected', 
        `Your doctor profile was rejected. Reason: ${adminMessage}`);

      res.json({
        message: 'Doctor request rejected',
        doctor: { id: doctorId, name: doctor.name, email: doctor.email }
      });
    } catch (error) {
      console.error('Reject doctor error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DoctorApprovalController;
