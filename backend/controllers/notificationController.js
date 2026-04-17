const NotificationModel = require('../models/Notification');

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;

      const notifications = await NotificationModel.findByUserId(userId);

      res.json({
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          message: n.message,
          isRead: n.is_read,
          createdAt: n.created_at
        }))
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      const updated = await NotificationModel.markAsRead(notificationId);
      if (!updated) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const updated = await NotificationModel.markAllAsRead(userId);

      res.json({
        message: 'All notifications marked as read',
        updated
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = NotificationController;
