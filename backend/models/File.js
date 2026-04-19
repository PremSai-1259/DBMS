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

  static async findMedicalReportsByPatientIdForDoctor(patientId, doctorId) {
    const query = `
      SELECT
        f.id,
        f.user_id,
        f.file_name,
        f.file_type,
        f.uploaded_at,
        latest_access.id AS access_request_id,
        latest_access.status AS access_status,
        latest_access.requested_at AS access_requested_at,
        latest_access.expires_at AS access_expires_at
      FROM files f
      LEFT JOIN (
        SELECT ra.*
        FROM record_access ra
        INNER JOIN (
          SELECT MAX(id) AS latest_id
          FROM record_access
          WHERE doctor_id = ?
          GROUP BY file_id
        ) latest ON latest.latest_id = ra.id
      ) latest_access
        ON latest_access.file_id = f.id
       AND latest_access.patient_id = f.user_id
       AND latest_access.doctor_id = ?
      WHERE f.user_id = ?
        AND f.file_type = 'medical_report'
      ORDER BY f.uploaded_at DESC
    `;
    const [rows] = await db.execute(query, [doctorId, doctorId, patientId]);
    return rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM files WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = FileModel;
