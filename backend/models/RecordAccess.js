const db = require('../configs/db');

class RecordAccessModel {
  static async createRequest(patientId, doctorId, fileId) {
    const query = `
      INSERT INTO record_access 
      (patient_id, doctor_id, file_id, status) 
      VALUES (?, ?, ?, 'pending')
    `;
    const [result] = await db.execute(query, [patientId, doctorId, fileId]);
    return result.insertId;
  }

  static async findById(id) {
    const query = 'SELECT * FROM record_access WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }

  static async findByDoctorId(doctorId) {
    const query = `
      SELECT ra.id, ra.patient_id, ra.doctor_id, ra.file_id AS fileId, ra.status, 
             ra.requested_at, ra.updated_at, ra.expires_at,
             u_doc.name as doctor_name, u_pat.name as patient_name, f.file_name
      FROM record_access ra
      JOIN users u_doc ON ra.doctor_id = u_doc.id
      JOIN users u_pat ON ra.patient_id = u_pat.id
      JOIN files f ON ra.file_id = f.id
      WHERE ra.doctor_id = ?
      ORDER BY ra.requested_at DESC
    `;
    const [rows] = await db.execute(query, [doctorId]);
    console.log(`[DB] findByDoctorId(${doctorId}) returned ${rows.length} rows`);
    console.log(`[DB] Query result:`, rows);
    return rows;
  }

  static async findByPatientId(patientId) {
    const query = `
      SELECT ra.id, ra.patient_id, ra.doctor_id, ra.file_id AS fileId, ra.status, 
             ra.requested_at, ra.updated_at, ra.expires_at,
             u.name as doctor_name, f.file_name
      FROM record_access ra
      JOIN users u ON ra.doctor_id = u.id
      JOIN files f ON ra.file_id = f.id
      WHERE ra.patient_id = ?
      ORDER BY ra.requested_at DESC
    `;
    const [rows] = await db.execute(query, [patientId]);
    return rows;
  }

  static async approve(accessId, expiresAt = null) {
    const query = `
      UPDATE record_access 
      SET status = 'approved', updated_at = NOW(), expires_at = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [expiresAt, accessId]);
    return result.affectedRows > 0;
  }

  static async reject(accessId) {
    const query = `
      UPDATE record_access 
      SET status = 'rejected', updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [accessId]);
    return result.affectedRows > 0;
  }

  static async revoke(accessId) {
    const query = `
      UPDATE record_access 
      SET status = 'rejected', updated_at = NOW(), expires_at = NULL
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [accessId]);
    return result.affectedRows > 0;
  }

  static async checkApprovedAccess(doctorId, fileId) {
    const query = `
      SELECT * FROM record_access 
      WHERE doctor_id = ? AND file_id = ? AND status = 'approved'
      AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const [rows] = await db.execute(query, [doctorId, fileId]);
    return rows[0] || null;
  }

  static async hasExistingRequest(patientId, doctorId, fileId) {
    const query = `
      SELECT id FROM record_access 
      WHERE patient_id = ? AND doctor_id = ? AND file_id = ? AND status = 'pending'
    `;
    const [rows] = await db.execute(query, [patientId, doctorId, fileId]);
    return rows.length > 0;
  }

  static async hasAccessRequest(doctorId, patientId) {
    const query = `
      SELECT id FROM record_access 
      WHERE doctor_id = ? AND patient_id = ? AND status IN ('pending', 'approved')
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [doctorId, patientId]);
    return rows.length > 0;
  }
}

module.exports = RecordAccessModel;
