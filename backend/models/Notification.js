const db = require('../configs/db');

class NotificationModel {
  static async create(userId, type, message) {
    const query = `
      INSERT INTO notifications 
      (user_id, type, message) 
      VALUES (?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, type, message]);
    return result.insertId;
  }

  static async findByUserId(userId) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  static async markAsRead(notificationId) {
    const query = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
    const [result] = await db.execute(query, [notificationId]);
    return result.affectedRows > 0;
  }

  static async markAllAsRead(userId) {
    const query = 'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0';
    const [result] = await db.execute(query, [userId]);
    return result.affectedRows > 0;
  }

  static async deleteOldNotifications(userId, daysOld = 30) {
    const query = `
      DELETE FROM notifications 
      WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const [result] = await db.execute(query, [userId, daysOld]);
    return result.affectedRows;
  }
}

module.exports = NotificationModel;
