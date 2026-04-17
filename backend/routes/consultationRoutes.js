const express = require('express');
const router = express.Router();
const ConsultationController = require('../controllers/consultationController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// POST /consultation
router.post('/', authMiddleware, roleMiddleware(['doctor']), 
  ConsultationController.createConsultation);

// GET /consultation/:appointmentId
router.get('/:appointmentId', authMiddleware, ConsultationController.getConsultation);

// PUT /consultation/:id
router.put('/:consultationId', authMiddleware, roleMiddleware(['doctor']), 
  ConsultationController.updateConsultation);

module.exports = router;
