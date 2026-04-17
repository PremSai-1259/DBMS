const express = require('express');
const router = express.Router();
const SlotController = require('../controllers/slotController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// POST /slots/generate
router.post('/generate', authMiddleware, roleMiddleware(['doctor']), 
  SlotController.generateSlots);

// GET /slots (public - for patients viewing available slots)
router.get('/', SlotController.getSlots);

// GET /slots/available
router.get('/available', SlotController.getAvailableSlots);

module.exports = router;
