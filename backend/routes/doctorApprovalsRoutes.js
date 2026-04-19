const express = require('express');
const router = express.Router();
const DoctorApprovalController = require('../controllers/doctorApprovalController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// Doctor routes
// GET /doctor-approvals/status - Doctor checks their own approval status
router.get('/status', authMiddleware, roleMiddleware(['doctor']), 
  DoctorApprovalController.getMyApprovalStatus);

// GET /doctor-approvals/history - Doctor checks approval submission history
router.get('/history', authMiddleware, roleMiddleware(['doctor']), 
  DoctorApprovalController.getApprovalHistory);

// POST /doctor-approvals/request - Doctor requests approval or resubmits after rejection
router.post('/request', authMiddleware, roleMiddleware(['doctor']), 
  DoctorApprovalController.requestApproval);

// Admin routes
// GET /doctor-approvals/pending - Admin gets pending approvals
router.get('/pending', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.getPendingDoctors);

// GET /doctor-approvals/doctor/:doctorId/details - Admin gets full doctor details for review
router.get('/doctor/:doctorId/details', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.getDoctorApprovalDetails);

// PUT /doctor-approvals/:approvalId/approve - Admin approves doctor
router.put('/:approvalId/approve', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.approveDoctorRequest);

// PUT /doctor-approvals/:approvalId/reject - Admin rejects doctor
router.put('/:approvalId/reject', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.rejectDoctorRequest);

module.exports = router;
