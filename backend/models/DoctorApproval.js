const db = require('../configs/db');

/**
 * ⚠️  IMPORTANT: DoctorApproval Model
 * 
 * This table stores APPROVAL WORKFLOW data ONLY, NOT profile data.
 * 
 * What this table stores:
 * ✅ doctor_id, certificate_file_id, status (pending/approved/rejected)
 * ✅ admin_message (rejection reason), submitted_at, reviewed_at
 * 
 * What this table does NOT store:
 * ❌ specialization, experience, hospital_name, address (NEVER!)
 * ❌ Any profile information
 * 
 * How profile data is accessed:
 * When admin needs to view doctor details, this model JOINs:
 * - doctor_approvals (approval status) 
 * - users (doctor name/email)
 * - doctor_profiles (profile data - specialization, experience, etc)
 * - files (certificate file info)
 * 
 * Profile data is the SINGLE SOURCE OF TRUTH in doctor_profiles table only.
 */

class DoctorApprovalModel {
  // Create new approval request (allows resubmission after rejection)
  static async create(doctorId, certificateFileId) {
    try {
      const query = `
        INSERT INTO doctor_approvals 
        (doctor_id, certificate_file_id, status) 
        VALUES (?, ?, 'pending')
      `;
      console.log(`[DoctorApprovalModel.create] Creating approval - doctorId: ${doctorId}, certificateFileId: ${certificateFileId}`);
      const [result] = await db.execute(query, [doctorId, certificateFileId]);
      console.log(`[DoctorApprovalModel.create] Success - insertId: ${result.insertId}`);
      return result.insertId;
    } catch (err) {
      console.error('[DoctorApprovalModel.create] Error:', err);
      console.error('[DoctorApprovalModel.create] Error code:', err.code);
      console.error('[DoctorApprovalModel.create] Error message:', err.message);
      throw err;
    }
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
    // Use a simpler query structure to avoid ambiguity
    const query = `
      SELECT 
        da.id as approvalId,
        da.doctor_id as doctorId,
        da.certificate_file_id as certificateFileId,
        da.status,
        da.admin_message as adminMessage,
        da.submitted_at as submittedAt,
        da.reviewed_at as reviewedAt,
        u.id as userId,
        u.name as doctorName,
        u.email as doctorEmail,
        f.id as fileId,
        f.file_path as filePath,
        f.file_name as fileName,
        dp.id as profileId,
        dp.specialization,
        dp.experience,
        dp.hospital_name as hospitalName,
        dp.address,
        dp.is_verified as isVerified
      FROM doctor_approvals da
      INNER JOIN users u ON da.doctor_id = u.id
      LEFT JOIN files f ON da.certificate_file_id = f.id
      LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id
      WHERE da.status = 'pending'
    `;
    console.log('[DoctorApprovalModel] Executing findPendingApprovals query');
    const [rows] = await db.execute(query);
    console.log('[DoctorApprovalModel] Query successful, rows:', rows.length);
    return rows;
  }

  // Get full approval details with doctor info
  static async findByIdWithDetails(approvalId) {
    const query = `
      SELECT 
        da.id,
        da.doctor_id as doctorId,
        da.certificate_file_id as certificateFileId,
        da.status,
        da.admin_message as adminMessage,
        da.submitted_at as submittedAt,
        da.reviewed_at as reviewedAt,
        u.id as userId,
        u.name,
        u.email,
        f.id as fileId,
        f.file_path as filePath,
        f.file_name as fileName,
        dp.id as profileId,
        dp.specialization,
        dp.experience,
        dp.hospital_name as hospitalName,
        dp.address,
        dp.is_verified as isVerified
      FROM doctor_approvals da
      INNER JOIN users u ON da.doctor_id = u.id
      LEFT JOIN files f ON da.certificate_file_id = f.id
      LEFT JOIN doctor_profiles dp ON da.doctor_id = dp.user_id
      WHERE da.id = ?
    `;
    const [rows] = await db.execute(query, [approvalId]);
    return rows[0] || null;
  }

  // Check if doctor has a pending approval
  static async hasPendingApproval(doctorId) {
    try {
      const query = `
        SELECT COUNT(*) as count FROM doctor_approvals 
        WHERE doctor_id = ? AND status = 'pending'
      `;
      console.log(`[DoctorApprovalModel.hasPendingApproval] Checking doctor_id: ${doctorId}`);
      const [rows] = await db.execute(query, [doctorId]);
      const hasPending = rows[0]?.count > 0;
      console.log(`[DoctorApprovalModel.hasPendingApproval] Result: ${hasPending} (count: ${rows[0]?.count})`);
      return hasPending;
    } catch (err) {
      console.error('[DoctorApprovalModel.hasPendingApproval] Error:', err);
      throw err;
    }
  }

  // Check if doctor is already approved
  static async isApproved(doctorId) {
    try {
      const query = `
        SELECT COUNT(*) as count FROM doctor_approvals 
        WHERE doctor_id = ? AND status = 'approved'
      `;
      console.log(`[DoctorApprovalModel.isApproved] Checking doctor_id: ${doctorId}`);
      const [rows] = await db.execute(query, [doctorId]);
      const approved = rows[0]?.count > 0;
      console.log(`[DoctorApprovalModel.isApproved] Result: ${approved} (count: ${rows[0]?.count})`);
      return approved;
    } catch (err) {
      console.error('[DoctorApprovalModel.isApproved] Error:', err);
      throw err;
    }
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

  // Get status counts for dashboard summary cards
  static async getStatusCounts() {
    const query = `
      SELECT status, COUNT(*) as count
      FROM doctor_approvals
      GROUP BY status
    `;
    const [rows] = await db.execute(query);

    return rows.reduce((acc, row) => {
      acc[row.status] = Number(row.count) || 0;
      return acc;
    }, {
      pending: 0,
      approved: 0,
      rejected: 0
    });
  }
}

module.exports = DoctorApprovalModel;
