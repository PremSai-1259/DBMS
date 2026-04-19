const db = require('../configs/db');

class AppointmentModel {
  static async create(patientId, doctorId, slotId) {
    const query = `
      INSERT INTO appointments 
      (patient_id, doctor_id, slot_id, status) 
      VALUES (?, ?, ?, 'confirmed')
    `;
    const [result] = await db.execute(query, [patientId, doctorId, slotId]);
    return result.insertId;
  }

  static async findById(id) {
    const query = 'SELECT * FROM appointments WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }

  static async findByPatientId(patientId) {
    const query = `
      SELECT
        a.*,
        s.slot_date,
        s.slot_number,
        s.slot_start_time,
        s.slot_end_time,
        u.name as doctor_name,
        u.email as doctor_email,
        cn.id AS consultation_id,
        cn.reason_for_visit,
        cn.diagnosis,
        cn.prescription,
        cn.additional_notes,
        cn.created_at AS consultation_created_at,
        cn.updated_at AS consultation_updated_at
      FROM appointments a
      JOIN appointment_slots s ON a.slot_id = s.id
      JOIN users u ON a.doctor_id = u.id
      LEFT JOIN consultation_notes cn ON cn.appointment_id = a.id
      WHERE a.patient_id = ?
      ORDER BY s.slot_date DESC
    `;
    const [rows] = await db.execute(query, [patientId]);
    return rows;
  }

  static async findByDoctorId(doctorId) {
    const query = `
      SELECT
        a.*,
        s.slot_date,
        s.slot_number,
        s.slot_start_time,
        s.slot_end_time,
        u.name as patient_name,
        u.email as patient_email,
        cn.id AS consultation_id,
        cn.reason_for_visit,
        cn.diagnosis,
        cn.prescription,
        cn.additional_notes,
        cn.created_at AS consultation_created_at,
        cn.updated_at AS consultation_updated_at
      FROM appointments a
      JOIN appointment_slots s ON a.slot_id = s.id
      JOIN users u ON a.patient_id = u.id
      LEFT JOIN consultation_notes cn ON cn.appointment_id = a.id
      WHERE a.doctor_id = ?
      ORDER BY s.slot_date DESC
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows;
  }

  static async cancel(appointmentId, cancelReason) {
    const query = `
      UPDATE appointments 
      SET status = 'cancelled', cancel_reason = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [cancelReason, appointmentId]);
    return result.affectedRows > 0;
  }

  static async markCompleted(appointmentId) {
    const query = 'UPDATE appointments SET status = ? WHERE id = ?';
    const [result] = await db.execute(query, ['completed', appointmentId]);
    return result.affectedRows > 0;
  }

  static async getAppointmentDetails(appointmentId) {
    const query = `
      SELECT a.*, 
             s.slot_date, s.slot_number,
             p.name as patient_name, d.name as doctor_name,
             u.email as patient_email, ud.email as doctor_email
      FROM appointments a
      JOIN appointment_slots s ON a.slot_id = s.id
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN users u ON a.patient_id = u.id
      LEFT JOIN users ud ON a.doctor_id = ud.id
      WHERE a.id = ?
    `;
    const [rows] = await db.execute(query, [appointmentId]);
    return rows[0] || null;
  }

  static async checkDuplicateBooking(patientId, slotId) {
    const query = `
      SELECT id FROM appointments 
      WHERE patient_id = ? AND slot_id = ? AND status != 'cancelled'
    `;
    const [rows] = await db.execute(query, [patientId, slotId]);
    return rows.length > 0;
  }

  static async hasDoctorPatientRelationship(doctorId, patientId) {
    const query = `
      SELECT id
      FROM appointments
      WHERE doctor_id = ? AND patient_id = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [doctorId, patientId]);
    return rows.length > 0;
  }

  static async findHistoryByDoctorAndPatient(doctorId, patientId) {
    const query = `
      SELECT
        a.*,
        s.slot_date,
        s.slot_number,
        s.slot_start_time,
        s.slot_end_time
      FROM appointments a
      JOIN appointment_slots s ON a.slot_id = s.id
      WHERE a.doctor_id = ? AND a.patient_id = ?
      ORDER BY s.slot_date DESC, s.slot_start_time DESC
    `;
    const [rows] = await db.execute(query, [doctorId, patientId]);
    return rows;
  }
}

module.exports = AppointmentModel;
