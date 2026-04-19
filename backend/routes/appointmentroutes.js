const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentcontroller');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// POST /appointments/book
router.post('/book', authMiddleware, roleMiddleware(['patient']), 
  AppointmentController.bookAppointment);

// PUT /appointments/cancel/:id
router.put('/cancel/:appointmentId', authMiddleware, roleMiddleware(['doctor']), 
  AppointmentController.cancelAppointment);

// GET /appointments
router.get('/', authMiddleware, AppointmentController.getAppointments);

// GET /appointments/patient/:patientId/summary
router.get('/patient/:patientId/summary', authMiddleware, roleMiddleware(['doctor']),
  AppointmentController.getDoctorPatientSummary);

// GET /appointments/doctor/:doctorId/profile
router.get('/doctor/:doctorId/profile', authMiddleware, roleMiddleware(['patient']),
  AppointmentController.getDoctorProfileWithHistory);

// GET /appointments/:id
router.get('/:appointmentId', authMiddleware, AppointmentController.getAppointmentDetails);

module.exports = router;
