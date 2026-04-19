const db = require('../configs/db');

class FileModel {
  static async create(userId, fileName, filePath, fileType, hashValue) {
    const query = `
      INSERT INTO files 
      (user_id, file_name, file_path, file_type, hash_value) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, fileName, filePath, fileType, hashValue]);
    return result.insertId;
  }

  static async findById(id) {
    const query = 'SELECT * FROM files WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }

  static async findByUserIdAndType(userId, fileType) {
    const query = 'SELECT * FROM files WHERE user_id = ? AND file_type = ? ORDER BY uploaded_at DESC';
    const [rows] = await db.execute(query, [userId, fileType]);
    return rows;
  }

  static async findAllByUserId(userId) {
    const query = 'SELECT * FROM files WHERE user_id = ? ORDER BY uploaded_at DESC';
    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  static async findMedicalReportsByPatientId(patientId) {
    const query = `
      SELECT * FROM files 
      WHERE user_id = ? AND file_type = 'medical_report'
      ORDER BY uploaded_at DESC
    `;
    const [rows] = await db.execute(query, [patientId]);
    return rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM files WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = FileModel;
