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
      SELECT a.*, s.slot_date, s.slot_number, u.name as doctor_name
      FROM appointments a
      JOIN appointment_slots s ON a.slot_id = s.id
      JOIN users u ON a.doctor_id = u.id
      WHERE a.patient_id = ?
      ORDER BY s.slot_date DESC
    `;
    const [rows] = await db.execute(query, [patientId]);
    return rows;
  }

  static async findByDoctorId(doctorId) {
    const query = `
      SELECT a.*, s.slot_date, s.slot_number, u.name as patient_name
      FROM appointments a
      JOIN appointment_slots s ON a.slot_id = s.id
      JOIN users u ON a.patient_id = u.id
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
}

module.exports = AppointmentModel;
