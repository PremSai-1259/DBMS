const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profilecontroller');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// Patient Profile
// POST /profile (creates patient or doctor profile)
router.post('/', authMiddleware, (req, res) => {
  const { age, gender, phone, bloodGroup, specialization, experience, hospitalName, address } = req.body;
  
  if (req.user.role === 'patient') {
    ProfileController.createPatientProfile(req, res);
  } else if (req.user.role === 'doctor') {
    ProfileController.createDoctorProfile(req, res);
  } else {
    res.status(400).json({ error: 'Invalid role' });
  }
});

// GET /profile
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role === 'patient') {
    ProfileController.getPatientProfile(req, res);
  } else if (req.user.role === 'doctor') {
    ProfileController.getDoctorProfile(req, res);
  } else {
    res.status(400).json({ error: 'Invalid role' });
  }
});

// PUT /profile
router.put('/', authMiddleware, (req, res) => {
  if (req.user.role === 'patient') {
    ProfileController.updatePatientProfile(req, res);
  } else if (req.user.role === 'doctor') {
    ProfileController.updateDoctorProfile(req, res);
  } else {
    res.status(400).json({ error: 'Invalid role' });
  }
});

module.exports = router;
