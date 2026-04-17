const db = require('../configs/db');

class DoctorProfileModel {
  static async create(userId, specialization, experience, hospitalName, address) {
    const query = `
      INSERT INTO doctor_profiles 
      (user_id, specialization, experience, hospital_name, address) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, specialization, experience, hospitalName, address]);
    return result.insertId;
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM doctor_profiles WHERE user_id = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows[0] || null;
  }

  static async updateProfile(userId, updateData) {
    const { specialization, experience, hospitalName, address, profileImageId, certificateFileId } = updateData;
    const query = `
      UPDATE doctor_profiles 
      SET specialization = ?, experience = ?, hospital_name = ?, address = ?, 
          profile_image_id = ?, certificate_file_id = ?
      WHERE user_id = ?
    `;
    const [result] = await db.execute(query, 
      [specialization || null, experience || null, hospitalName || null, address || null, 
       profileImageId || null, certificateFileId || null, userId]
    );
    return result.affectedRows > 0;
  }

  static async setVerified(userId, verified = true) {
    const query = 'UPDATE doctor_profiles SET is_verified = ? WHERE user_id = ?';
    const [result] = await db.execute(query, [verified, userId]);
    return result.affectedRows > 0;
  }

  static async isVerified(userId) {
    const query = 'SELECT is_verified FROM doctor_profiles WHERE user_id = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows[0]?.is_verified || false;
  }

  static async updateRating(doctorId) {
    const query = `
      UPDATE doctor_profiles dp
      SET average_rating = (
        SELECT COALESCE(AVG(r.rating), 0) 
        FROM reviews r
        WHERE r.doctor_id = ?
      )
      WHERE user_id = ?
    `;
    const [result] = await db.execute(query, [doctorId, doctorId]);
    return result.affectedRows > 0;
  }
}

module.exports = DoctorProfileModel;
