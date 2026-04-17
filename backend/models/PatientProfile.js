const db = require('../configs/db');

class PatientProfileModel {
  static async create(userId, age, gender, phone, bloodGroup) {
    const query = `
      INSERT INTO patient_profiles 
      (user_id, age, gender, phone, blood_group) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, age, gender, phone, bloodGroup]);
    return result.insertId;
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM patient_profiles WHERE user_id = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows[0] || null;
  }

  static async updateProfile(userId, updateData) {
    const { age, gender, phone, bloodGroup, profileImageId } = updateData;
    const query = `
      UPDATE patient_profiles 
      SET age = ?, gender = ?, phone = ?, blood_group = ?, profile_image_id = ?
      WHERE user_id = ?
    `;
    const [result] = await db.execute(query, 
      [age || null, gender || null, phone || null, bloodGroup || null, profileImageId || null, userId]
    );
    return result.affectedRows > 0;
  }

  static async exists(userId) {
    const query = 'SELECT id FROM patient_profiles WHERE user_id = ?';
    const [rows] = await db.execute(query, [userId]);
    return rows.length > 0;
  }
}

module.exports = PatientProfileModel;
