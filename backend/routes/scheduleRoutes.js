const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// GET /schedule/slot-times - Get all slot time display info
router.get('/slot-times', ScheduleController.getSlotTimes);

// GET /schedule/date - Get all 24 slots for a specific date (doctor authenticated)
router.get('/date', authMiddleware, roleMiddleware(['doctor']), ScheduleController.getSlotsForDate);

// POST /schedule/slot - Update single slot availability
router.post('/slot', authMiddleware, roleMiddleware(['doctor']), ScheduleController.updateSlotAvailability);

// POST /schedule/bulk - Update multiple slots at once
router.post('/bulk', authMiddleware, roleMiddleware(['doctor']), ScheduleController.updateMultipleSlots);

// GET /schedule/week - Get week schedule
router.get('/week', authMiddleware, roleMiddleware(['doctor']), ScheduleController.getWeekSchedule);

// GET /schedule/range - Get schedule for date range
router.get('/range', authMiddleware, roleMiddleware(['doctor']), ScheduleController.getScheduleRange);

module.exports = router;
