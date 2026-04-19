const express = require('express');
const router = express.Router();
const SlotController = require('../controllers/slotController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// POST /slots/generate
router.post('/generate', authMiddleware, roleMiddleware(['doctor']), 
  SlotController.generateSlots);

// GET /slots/available (must come before /slots/doctor/:doctorId)
router.get('/available', SlotController.getAvailableSlots);

// GET /slots/doctor/:doctorId (public - for booking modal to fetch slots for a specific doctor)
router.get('/doctor/:doctorId', SlotController.getAvailableSlotsForDoctor);

// GET /slots (public - for patients viewing available slots) - MUST BE LAST
router.get('/', SlotController.getSlots);

module.exports = router;
