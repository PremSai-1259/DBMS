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

      console.log(`[requestApproval] ⚡ START - Doctor ID: ${doctorId}, Certificate File ID: ${certificateFileId}`);

      // ============ VALIDATION ============
      if (!certificateFileId) {
        console.warn(`[requestApproval] ❌ Missing certificateFileId`);
        return res.status(400).json({ 
          error: 'certificateFileId is required',
          code: 'MISSING_CERT_FILE_ID'
        });
      }

      // ============ CHECK PROFILE EXISTS ============
      console.log('[requestApproval] 📋 Step 1: Validating doctor profile...');
      let doctorProfile;
      try {
        doctorProfile = await DoctorProfileModel.findByUserId(doctorId);
      } catch (err) {
        console.error('[requestApproval] ❌ Database error checking profile:', err.message);
        return res.status(500).json({ 
          error: 'Failed to validate doctor profile',
          code: 'DB_ERROR_PROFILE_CHECK',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      if (!doctorProfile) {
        console.log('[requestApproval] ❌ Profile not found for doctor:', doctorId);
        return res.status(400).json({ 
          error: 'Doctor profile must be created first',
          code: 'PROFILE_NOT_FOUND',
          suggestion: 'Please complete your profile information first'
        });
      }

      // ============ VALIDATE PROFILE DATA COMPLETENESS ============
      const requiredFields = {
        specialization: doctorProfile.specialization,
        experience: doctorProfile.experience,
        hospital_name: doctorProfile.hospital_name,
        address: doctorProfile.address
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.warn('[requestApproval] ❌ Incomplete profile - missing fields:', missingFields);
        return res.status(400).json({ 
          error: 'Incomplete doctor profile. Please fill in all required fields',
          code: 'INCOMPLETE_PROFILE',
          missingFields,
          suggestion: 'Complete your profile: ' + missingFields.join(', ')
        });
      }

      console.log('[requestApproval] ✅ Profile validation passed');

      // ============ CHECK FOR EXISTING PENDING APPROVAL ============
      console.log('[requestApproval] 📋 Step 2: Checking for existing pending approval...');
      let hasPending = false;
      try {
        hasPending = await DoctorApprovalModel.hasPendingApproval(doctorId);
        console.log('[requestApproval] Pending check result:', hasPending);
      } catch (err) {
        console.error('[requestApproval] ❌ Error checking pending approval:', err.message);
        // Don't block - this is a retrieval error, not validation failure
      }
      
      if (hasPending) {
        console.log('[requestApproval] ⚠️  409 - Doctor already has pending approval');
        return res.status(409).json({ 
          error: 'You already have a pending approval request',
          code: 'APPROVAL_ALREADY_PENDING',
          suggestion: 'Please wait for admin review. Do not resubmit.'
        });
      }

      // ============ CHECK FOR EXISTING APPROVED STATUS ============
      console.log('[requestApproval] 📋 Step 3: Checking approval status...');
      let isApproved = false;
      try {
        isApproved = await DoctorApprovalModel.isApproved(doctorId);
        console.log('[requestApproval] Approved check result:', isApproved);
      } catch (err) {
        console.error('[requestApproval] ❌ Error checking approval status:', err.message);
        // Don't block
      }
      
      if (isApproved) {
        console.log('[requestApproval] ⚠️  409 - Doctor already approved');
        return res.status(409).json({ 
          error: 'Your doctor profile is already approved',
          code: 'ALREADY_APPROVED',
          suggestion: 'Your profile has been approved. Access your dashboard.'
        });
      }

      // ============ CREATE APPROVAL REQUEST ============
      console.log('[requestApproval] 📋 Step 4: Creating approval request...');
      let approvalId;
      try {
        approvalId = await DoctorApprovalModel.create(doctorId, certificateFileId);
        console.log('[requestApproval] ✅ Approval created with ID:', approvalId);
      } catch (err) {
        console.error('[requestApproval] ❌ Error creating approval record:', err.message);
        console.error('[requestApproval] SQL Error:', err.code, err.sqlState);
        return res.status(500).json({ 
          error: 'Failed to create approval request',
          code: 'APPROVAL_CREATE_FAILED',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      // ============ OPTIONAL: UPDATE PROFILE WITH CERTIFICATE ============
      console.log('[requestApproval] 📋 Step 5: Updating profile with certificate...');
      try {
        const profileUpdated = await DoctorProfileModel.updateProfile(doctorId, { certificateFileId });
        if (profileUpdated) {
          console.log('[requestApproval] ✅ Profile updated with certificate ID:', certificateFileId);
        } else {
          console.warn('[requestApproval] ⚠️  Profile update returned false (no rows affected)');
        }
      } catch (updateErr) {
        console.error('[requestApproval] ❌ Error updating profile:', updateErr.message);
        console.error('[requestApproval] Error details:', {
          code: updateErr.code,
          sqlState: updateErr.sqlState,
          message: updateErr.message
        });
        // Continue anyway - certificate is stored in doctor_approvals which is what matters
        console.log('[requestApproval] ℹ️  Continuing - certificate stored in approval record');
      }

      // ============ SUCCESS RESPONSE ============
      console.log('[requestApproval] ✅ SUCCESS - Approval request completed');
      res.status(201).json({
        message: 'Request sent for approval successfully',
        approvalId,
        status: 'pending',
        nextSteps: 'Your profile has been submitted for admin review. You will receive an email notification once reviewed.'
      });

    } catch (error) {
      console.error('❌ [requestApproval] UNHANDLED ERROR:', error.message);
      console.error('[requestApproval] Error type:', error.constructor.name);
      console.error('[requestApproval] Stack:', error.stack);
      
      res.status(500).json({ 
        error: 'An unexpected error occurred while processing your approval request',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          type: error.constructor.name,
          stack: error.stack
        } : undefined
      });
    }
  }

  // Admin gets all pending doctor approvals
  static async getPendingDoctors(req, res) {
    try {
      console.log('[getPendingDoctors] ⚡ Fetching pending doctor approvals...');
      
      // Admin only - checked by roleMiddleware
      let pending;
      try {
        pending = await DoctorApprovalModel.findPendingApprovals();
        console.log('[getPendingDoctors] ✅ Found', pending.length, 'pending approvals');
      } catch (queryErr) {
        console.error('[getPendingDoctors] ❌ Query failed:', queryErr.message);
        console.error('[getPendingDoctors] SQL Error:', queryErr.code);
        throw new Error(`Failed to fetch pending approvals: ${queryErr.message}`);
      }

      // Transform the response with defensive null handling
      const enrichedPending = pending.map((approval) => {
        try {
          return {
            approvalId: approval.approvalId,
            doctorId: approval.doctorId,
            status: approval.status,
            submittedAt: approval.submittedAt,
            reviewedAt: approval.reviewedAt,
            certificateFileId: approval.certificateFileId,
            certificateFileName: approval.fileName ? approval.fileName.split('/').pop() : 'certificate',
            doctor: {
              id: approval.doctorId,
              name: approval.doctorName || 'Unknown',
              email: approval.doctorEmail || 'Unknown',
              specialization: approval.specialization || 'N/A',
              experience: approval.experience || 0,
              hospitalName: approval.hospitalName || 'N/A',
              address: approval.address || 'N/A',
              isVerified: approval.isVerified
            }
          };
        } catch (mapErr) {
          console.error('[getPendingDoctors] Error transforming approval:', mapErr);
          throw mapErr;
        }
      });

      console.log('[getPendingDoctors] ✅ Returning', enrichedPending.length, 'enriched records');
      res.json({
        pending: enrichedPending,
        count: enrichedPending.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[getPendingDoctors] ❌ UNHANDLED ERROR:', error.message);
      console.error('[getPendingDoctors] Stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to fetch pending doctor approvals',
        code: 'GET_PENDING_FAILED',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Admin gets doctor details for approval review
  static async getDoctorApprovalDetails(req, res) {
    try {
      const { doctorId } = req.params;
      
      // Get latest pending approval
      const approval = await DoctorApprovalModel.findLatestByDoctorId(doctorId);
      if (!approval || approval.status !== 'pending') {
        return res.status(404).json({ error: 'No pending approval found for this doctor' });
      }

      // Get full approval details with joined data
      const details = await DoctorApprovalModel.findByIdWithDetails(approval.id);
      if (!details) {
        return res.status(404).json({ error: 'Approval details not found' });
      }

      // Get all files uploaded by doctor
      const FileModel = require('../models/File');
      const allFiles = await FileModel.findAllByUserId(doctorId);

      res.json({
        approval: {
          id: details.id,
          status: details.status,
          submittedAt: details.submittedAt,
          reviewedAt: details.reviewedAt,
          adminMessage: details.adminMessage
        },
        doctor: {
          id: details.doctorId,
          name: details.name,
          email: details.email,
          specialization: details.specialization,
          experience: details.experience,
          hospitalName: details.hospitalName,
          address: details.address,
          isVerified: details.isVerified
        },
        certificateFile: details.certificateFileId ? {
          id: details.certificateFileId,
          name: details.fileName,
          path: details.filePath
        } : null,
        allFiles: allFiles.map(file => ({
          id: file.id,
          name: file.file_name,
          type: file.file_type,
          uploadedAt: file.uploaded_at,
          hashValue: file.hash_value
        }))
      });
    } catch (error) {
      console.error('Get doctor approval details error:', error);
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

      // CRITICAL: Verify doctor profile exists and has all required data
      const doctorProfile = await DoctorProfileModel.findByUserId(doctorId);
      if (!doctorProfile) {
        return res.status(400).json({ 
          error: 'Doctor profile not found. Cannot approve without a profile.' 
        });
      }

      if (!doctorProfile.specialization || !doctorProfile.experience || !doctorProfile.hospital_name || !doctorProfile.address) {
        return res.status(400).json({ 
          error: 'Doctor profile is incomplete. Cannot approve.',
          missingFields: {
            specialization: !doctorProfile.specialization,
            experience: !doctorProfile.experience,
            hospitalName: !doctorProfile.hospital_name,
            address: !doctorProfile.address
          }
        });
      }

      // 🔗 CRITICAL: Link certificate from approval to doctor profile
      console.log(`[approveDoctorRequest] 🔗 Linking certificate - certificateFileId: ${approval.certificate_file_id}`);
      if (approval.certificate_file_id) {
        try {
          await DoctorProfileModel.updateProfile(doctorId, { 
            certificateFileId: approval.certificate_file_id 
          });
          console.log(`[approveDoctorRequest] ✅ Certificate linked to profile`);
        } catch (linkErr) {
          console.error(`[approveDoctorRequest] ❌ Failed to link certificate:`, linkErr.message);
          return res.status(500).json({ 
            error: 'Failed to link certificate to profile',
            code: 'CERTIFICATE_LINK_FAILED'
          });
        }
      }

      // Mark doctor as verified in profile
      await DoctorProfileModel.setVerified(doctorId, true);

      // Update approval status
      await DoctorApprovalModel.approve(approvalId, doctorId);

      // Get doctor info
      const doctor = await UserModel.findById(doctorId);

      console.log(`[approveDoctorRequest] ✅ APPROVED - Doctor ID: ${doctorId}, Sending notifications async...`);

      // Send email notification and create notification ASYNC (don't block response)
      setImmediate(async () => {
        try {
          const emailTemplate = emailTemplates.doctorApproved(doctor.name);
          await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);
          console.log(`[approveDoctorRequest] 📧 Email sent to ${doctor.email}`);
        } catch (emailErr) {
          console.error(`[approveDoctorRequest] ⚠️ Email send failed:`, emailErr.message);
        }
      });

      setImmediate(async () => {
        try {
          await NotificationModel.create(doctorId, 'doctor_approved', 
            'Your doctor profile has been approved! ✅ You can now generate appointment slots and start accepting patient appointments.');
          console.log(`[approveDoctorRequest] 🔔 Notification created for doctor ${doctorId}`);
        } catch (notifErr) {
          console.error(`[approveDoctorRequest] ⚠️ Notification creation failed:`, notifErr.message);
        }
      });

      // Return complete profile data to confirm approval (response sent immediately)
      console.log(`[approveDoctorRequest] 📨 Response sent - Notifications sending in background`);
      res.json({
        message: 'Doctor approved successfully',
        doctor: { 
          id: doctorId, 
          name: doctor.name, 
          email: doctor.email,
          specialization: doctorProfile.specialization,
          experience: doctorProfile.experience,
          hospitalName: doctorProfile.hospital_name,
          address: doctorProfile.address,
          isVerified: true
        }
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

      // Get doctor info before deletion
      const doctor = await UserModel.findById(doctorId);

      // Step 1: Update approval status with rejection message (for history)
      await DoctorApprovalModel.reject(approvalId, doctorId, adminMessage);

      // Step 2: DELETE doctor profile from database
      // When rejected, doctor must resubmit with corrections
      const profileDeleted = await DoctorProfileModel.deleteByUserId(doctorId);
      
      if (!profileDeleted) {
        console.warn(`[rejectDoctorRequest] Could not delete profile for doctor ${doctorId}`);
      } else {
        console.log(`[rejectDoctorRequest] ✅ Deleted profile for rejected doctor ${doctorId}`);
      }

      console.log(`[rejectDoctorRequest] ✅ REJECTED - Doctor ID: ${doctorId}, Sending notifications async...`);

      // Step 3 & 4: Send email and create notification ASYNC (don't block response)
      setImmediate(async () => {
        try {
          const emailTemplate = emailTemplates.doctorRejected(doctor.name, adminMessage);
          await sendEmail(doctor.email, emailTemplate.subject, emailTemplate.html);
          console.log(`[rejectDoctorRequest] 📧 Rejection email sent to ${doctor.email}`);
        } catch (emailErr) {
          console.error(`[rejectDoctorRequest] ⚠️ Email send failed:`, emailErr.message);
        }
      });

      setImmediate(async () => {
        try {
          await NotificationModel.create(doctorId, 'doctor_rejected', 
            `Your doctor profile approval was declined. Reason: ${adminMessage}. You can resubmit with corrections.`);
          console.log(`[rejectDoctorRequest] 🔔 Rejection notification created for doctor ${doctorId}`);
        } catch (notifErr) {
          console.error(`[rejectDoctorRequest] ⚠️ Notification creation failed:`, notifErr.message);
        }
      });

      // Send response immediately (notifications sending in background)
      console.log(`[rejectDoctorRequest] 📨 Response sent - Notifications sending in background`);
      res.json({
        message: 'Doctor request rejected and profile data deleted',
        doctor: { id: doctorId, name: doctor.name, email: doctor.email },
        rejection: {
          reason: adminMessage,
          status: 'rejected',
          profileDeleted: profileDeleted,
          resubmissionAllowed: true
        }
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
