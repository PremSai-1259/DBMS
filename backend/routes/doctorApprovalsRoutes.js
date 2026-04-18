const express = require('express');
const router = express.Router();
const DoctorApprovalController = require('../controllers/doctorApprovalController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// POST /doctor-approvals/request - Doctor requests approval
router.post('/request', authMiddleware, roleMiddleware(['doctor']), 
  DoctorApprovalController.requestApproval);

// GET /doctor-approvals/pending - Admin gets pending approvals
router.get('/pending', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.getPendingDoctors);

// PUT /doctor-approvals/:approvalId/approve - Admin approves doctor
router.put('/:approvalId/approve', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.approveDoctorRequest);

// PUT /doctor-approvals/:approvalId/reject - Admin rejects doctor
router.put('/:approvalId/reject', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.rejectDoctorRequest);

module.exports = router;
