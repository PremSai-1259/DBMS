const db = require('../configs/db');

class DoctorApprovalModel {
  // Create new approval request (allows resubmission after rejection)
  static async create(doctorId, certificateFileId) {
    const query = `
      INSERT INTO doctor_approvals 
      (doctor_id, certificate_file_id, status) 
      VALUES (?, ?, 'pending')
    `;
    const [result] = await db.execute(query, [doctorId, certificateFileId]);
    return result.insertId;
  }

  // Get the latest approval for a doctor
  static async findLatestByDoctorId(doctorId) {
    const query = `
      SELECT * FROM doctor_approvals 
      WHERE doctor_id = ? 
      ORDER BY id DESC 
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows[0] || null;
  }

  // Get latest approved request
  static async findApprovedByDoctorId(doctorId) {
    const query = `
      SELECT * FROM doctor_approvals 
      WHERE doctor_id = ? AND status = 'approved'
      ORDER BY reviewed_at DESC
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows[0] || null;
  }

  // Get all approval records for a doctor (for history)
  static async findAllByDoctorId(doctorId) {
    const query = `
      SELECT * FROM doctor_approvals 
      WHERE doctor_id = ? 
      ORDER BY id DESC
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows;
  }

  // Find pending approvals for admin review
  static async findPendingApprovals() {
    const query = `
      SELECT da.*, u.name, u.email, f.file_path, dp.specialization, dp.experience
      FROM doctor_approvals da
      JOIN users u ON da.doctor_id = u.id
      LEFT JOIN files f ON da.certificate_file_id = f.id
      LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id
      WHERE da.status = 'pending'
      ORDER BY da.submitted_at DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  // Check if doctor has a pending approval
  static async hasPendingApproval(doctorId) {
    const query = `
      SELECT COUNT(*) as count FROM doctor_approvals 
      WHERE doctor_id = ? AND status = 'pending'
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows[0]?.count > 0;
  }

  // Check if doctor is already approved
  static async isApproved(doctorId) {
    const query = `
      SELECT COUNT(*) as count FROM doctor_approvals 
      WHERE doctor_id = ? AND status = 'approved'
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows[0]?.count > 0;
  }

  // Update approval status to approved
  static async approve(approvalId, doctorId) {
    const query = `
      UPDATE doctor_approvals 
      SET status = 'approved', reviewed_at = NOW()
      WHERE id = ? AND doctor_id = ?
    `;
    const [result] = await db.execute(query, [approvalId, doctorId]);
    return result.affectedRows > 0;
  }

  // Update approval status to rejected with message
  static async reject(approvalId, doctorId, adminMessage) {
    const query = `
      UPDATE doctor_approvals 
      SET status = 'rejected', admin_message = ?, reviewed_at = NOW()
      WHERE id = ? AND doctor_id = ?
    `;
    const [result] = await db.execute(query, [adminMessage, approvalId, doctorId]);
    return result.affectedRows > 0;
  }

  // Find by ID
  static async findById(id) {
    const query = 'SELECT * FROM doctor_approvals WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }

  // Get count of pending approvals
  static async getPendingCount() {
    const query = 'SELECT COUNT(*) as count FROM doctor_approvals WHERE status = "pending"';
    const [rows] = await db.execute(query);
    return rows[0]?.count || 0;
  }
}

module.exports = DoctorApprovalModel;
