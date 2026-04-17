const db = require('../configs/db');

class DoctorApprovalModel {
  static async create(doctorId, certificateFileId) {
    const query = `
      INSERT INTO doctor_approvals 
      (doctor_id, certificate_file_id) 
      VALUES (?, ?)
    `;
    const [result] = await db.execute(query, [doctorId, certificateFileId]);
    return result.insertId;
  }

  static async findByDoctorId(doctorId) {
    const query = 'SELECT * FROM doctor_approvals WHERE doctor_id = ?';
    const [rows] = await db.execute(query, [doctorId]);
    return rows[0] || null;
  }

  static async findPendingApprovals() {
    const query = `
      SELECT da.*, u.name, u.email, f.file_path
      FROM doctor_approvals da
      JOIN users u ON da.doctor_id = u.id
      LEFT JOIN files f ON da.certificate_file_id = f.id
      WHERE da.status = 'pending'
      ORDER BY da.id DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  static async approve(approvalId, doctorId) {
    const query = `
      UPDATE doctor_approvals 
      SET status = 'approved', reviewed_at = NOW()
      WHERE id = ? AND doctor_id = ?
    `;
    const [result] = await db.execute(query, [approvalId, doctorId]);
    return result.affectedRows > 0;
  }

  static async reject(approvalId, doctorId, adminMessage) {
    const query = `
      UPDATE doctor_approvals 
      SET status = 'rejected', admin_message = ?, reviewed_at = NOW()
      WHERE id = ? AND doctor_id = ?
    `;
    const [result] = await db.execute(query, [adminMessage, approvalId, doctorId]);
    return result.affectedRows > 0;
  }

  static async findById(id) {
    const query = 'SELECT * FROM doctor_approvals WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }
}

module.exports = DoctorApprovalModel;
