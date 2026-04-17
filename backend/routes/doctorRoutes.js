const express = require('express');
const router = express.Router();
const DoctorApprovalController = require('../controllers/doctorApprovalController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// POST /doctor/request-approval
router.post('/request-approval', authMiddleware, roleMiddleware(['doctor']), 
  DoctorApprovalController.requestApproval);

// GET /admin/pending-doctors
router.get('/admin/pending-doctors', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.getPendingDoctors);

// PUT /admin/approve/:id
router.put('/admin/approve/:approvalId', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.approveDoctorRequest);

// PUT /admin/reject/:id
router.put('/admin/reject/:approvalId', authMiddleware, roleMiddleware(['admin']), 
  DoctorApprovalController.rejectDoctorRequest);

module.exports = router;
