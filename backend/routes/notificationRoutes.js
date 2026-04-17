const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authmiddleware');

// GET /notifications
router.get('/', authMiddleware, NotificationController.getNotifications);

// PUT /notifications/:id/read
router.put('/:notificationId/read', authMiddleware, NotificationController.markAsRead);

// PUT /notifications/read-all
router.put('/read-all', authMiddleware, NotificationController.markAllAsRead);

module.exports = router;
