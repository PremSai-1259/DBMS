const DoctorApprovalModel = require('../models/DoctorApproval');
const DoctorProfileModel = require('../models/DoctorProfile');
const UserModel = require('../models/User');
const NotificationModel = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/helpers');

class DoctorApprovalController {
  // Get doctor's current approval status
  static async getMyApprovalStatus(req, res) {
    try {
      const doctorId = req.user.id;

      // Get latest approval request
      const approval = await DoctorApprovalModel.findLatestByDoctorId(doctorId);

      if (!approval) {
        return res.json({
          hasProfile: false,
          status: null,
          message: 'No profile approval request found'
        });
      }

      // Get doctor profile info
      const doctorProfile = await DoctorProfileModel.findByUserId(doctorId);

      // For rejected status, include the admin message so doctor knows what to fix
      res.json({
        hasProfile: true,
        approvalId: approval.id,
        status: approval.status, // 'pending', 'approved', 'rejected'
        submittedAt: approval.submitted_at,
        reviewedAt: approval.reviewed_at,
        adminMessage: approval.admin_message, // Reason for rejection
        doctorProfile: {
          specialization: doctorProfile?.specialization,
          experience: doctorProfile?.experience,
          hospitalName: doctorProfile?.hospital_name,
          address: doctorProfile?.address,
          isVerified: doctorProfile?.is_verified
        }
      });
    } catch (error) {
      console.error('Get approval status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Doctor requests approval (initial or resubmission after rejection)
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

      // Check if already approved
      const isApproved = await DoctorApprovalModel.isApproved(doctorId);
      if (isApproved) {
        return res.status(409).json({ error: 'Your doctor profile is already approved' });
      }

      // Check if already has pending approval
      const hasPending = await DoctorApprovalModel.hasPendingApproval(doctorId);
      if (hasPending) {
        return res.status(409).json({ error: 'You already have a pending approval request. Please wait for admin review.' });
      }

      // Create new approval request (allows resubmission after rejection)
      const approvalId = await DoctorApprovalModel.create(doctorId, certificateFileId);

      // Update doctor profile with latest certificate file ID
      await DoctorProfileModel.updateProfile(doctorId, { certificateFileId });

      res.status(201).json({
        message: 'Doctor approval request submitted successfully',
        approvalId,
        status: 'pending'
      });
    } catch (error) {
      console.error('Request approval error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Admin gets all pending doctor approvals
  static async getPendingDoctors(req, res) {
    try {
      // Admin only - checked by roleMiddleware
      const pending = await DoctorApprovalModel.findPendingApprovals();

      // Enrich with file download URL
      const enrichedPending = pending.map((approval) => ({
        approvalId: approval.id,
        status: approval.status,
        submittedAt: approval.submitted_at,
        reviewedAt: approval.reviewed_at,
        certificateFileId: approval.certificate_file_id,
        certificateFileName: approval.file_path ? approval.file_path.split('/').pop() : 'certificate',
        doctor: {
          id: approval.doctor_id,
          name: approval.name || 'Unknown',
          email: approval.email || 'Unknown',
          specialization: approval.specialization || 'N/A',
          experience: approval.experience || 0
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

  // Admin approves doctor request
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

      // Mark doctor as verified in profile
      await DoctorProfileModel.setVerified(doctorId, true);

      // Update approval status
      await DoctorApprovalModel.approve(approvalId, doctorId);

      // Get doctor info
      const doctor = await UserModel.findById(doctorId);

      // Send email notification
      const emailTemplate = emailTemplates.doctorApproved(doctor.name);
      await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);

      // Create notification for doctor
      await NotificationModel.create(doctorId, 'doctor_approved', 
        'Your doctor profile has been approved! ✅ You can now generate appointment slots and start accepting patient appointments.');

      res.json({
        message: 'Doctor approved successfully',
        doctor: { id: doctorId, name: doctor.name, email: doctor.email }
      });
    } catch (error) {
      console.error('Approve doctor error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Admin rejects doctor request
  static async rejectDoctorRequest(req, res) {
    try {
      const { approvalId } = req.params;
      const { adminMessage } = req.body;

      // Validation
      if (!adminMessage || adminMessage.trim().length < 5) {
        return res.status(400).json({ error: 'Rejection reason required (minimum 5 characters)' });
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

      // Update approval status with rejection message
      await DoctorApprovalModel.reject(approvalId, doctorId, adminMessage);

      // Get doctor info
      const doctor = await UserModel.findById(doctorId);

      // Send email notification with reason
      const emailTemplate = emailTemplates.doctorRejected(doctor.name, adminMessage);
      await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);

      // Create notification for doctor - include resubmission option
      await NotificationModel.create(doctorId, 'doctor_rejected', 
        `Your doctor profile approval was declined. Reason: ${adminMessage}. You can resubmit with corrections.`);

      res.json({
        message: 'Doctor request rejected',
        doctor: { id: doctorId, name: doctor.name, email: doctor.email }
      });
    } catch (error) {
      console.error('Reject doctor error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get approval history for a doctor (for debugging/tracking)
  static async getApprovalHistory(req, res) {
    try {
      const doctorId = req.user.id;

      const history = await DoctorApprovalModel.findAllByDoctorId(doctorId);

      res.json({
        history,
        count: history.length
      });
    } catch (error) {
      console.error('Get approval history error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DoctorApprovalController;
