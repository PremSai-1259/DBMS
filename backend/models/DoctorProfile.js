const db = require('../configs/db');

/**
 * ⚠️  IMPORTANT: DoctorProfile Model
 * Profile data is STRICTLY stored in doctor_profiles table ONLY.
 * No profile data should be stored in users, doctor_approvals, or any other table.
 * This model is the SINGLE SOURCE OF TRUTH for all doctor profile information.
 */

class DoctorProfileModel {
  /**
   * Create new doctor profile - profile data stored ONLY in doctor_profiles table
   * @param {number} userId - Doctor's user ID (foreign key)
   * @param {string} specialization - Medical specialization
   * @param {number} experience - Years of experience (0-70)
   * @param {string} hospitalName - Hospital/Clinic name
   * @param {string} address - Professional address (min 10 chars)
   * @returns {number} Profile ID
   */
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

  /**
   * Update doctor profile - ONLY updates fields in doctor_profiles table
   * Uses dynamic query to prevent accidentally NULLing fields not provided
   * @param {number} userId - Doctor's user ID
   * @param {object} updateData - Object with only fields to update
   *   {specialization?, experience?, hospitalName?, address?, certificateFileId?, profileImageId?}
   * @returns {boolean} True if update successful
   * 
   * ⚠️  STRICT RULE: No profile data is EVER stored in other tables
   */
  static async updateProfile(userId, updateData) {
    // Build dynamic query - only update fields that are actually provided
    const updates = [];
    const values = [];

    if (updateData.specialization !== undefined && updateData.specialization !== null) {
      updates.push('specialization = ?');
      values.push(updateData.specialization);
    }

    if (updateData.experience !== undefined && updateData.experience !== null) {
      updates.push('experience = ?');
      values.push(updateData.experience);
    }

    if (updateData.hospitalName !== undefined && updateData.hospitalName !== null) {
      updates.push('hospital_name = ?');
      values.push(updateData.hospitalName);
    }

    if (updateData.address !== undefined && updateData.address !== null) {
      updates.push('address = ?');
      values.push(updateData.address);
    }

    if (updateData.profileImageId !== undefined && updateData.profileImageId !== null) {
      updates.push('profile_image_id = ?');
      values.push(updateData.profileImageId);
    }

    if (updateData.certificateFileId !== undefined && updateData.certificateFileId !== null) {
      updates.push('certificate_file_id = ?');
      values.push(updateData.certificateFileId);
    }

    // Only execute query if there are fields to update
    if (updates.length === 0) {
      return true; // No updates needed
    }

    values.push(userId); // Add userId for WHERE clause

    const query = `UPDATE doctor_profiles SET ${updates.join(', ')} WHERE user_id = ?`;
    const [result] = await db.execute(query, values);
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

  /**
   * Delete doctor profile by user ID
   * Called when admin REJECTS a doctor's approval request
   * All profile data is DELETED so doctor must resubmit with corrections
   * @param {number} userId - Doctor's user ID
   * @returns {boolean} True if deletion successful
   */
  static async deleteByUserId(userId) {
    const query = 'DELETE FROM doctor_profiles WHERE user_id = ?';
    const [result] = await db.execute(query, [userId]);
    return result.affectedRows > 0;
  }
}

module.exports = DoctorProfileModel;
