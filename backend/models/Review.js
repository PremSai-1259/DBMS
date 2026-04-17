const db = require('../configs/db');

class ReviewModel {
  static async create(appointmentId, patientId, doctorId, rating, comment) {
    const query = `
      INSERT INTO reviews 
      (appointment_id, patient_id, doctor_id, rating, comment) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [appointmentId, patientId, doctorId, rating, comment]);
    return result.insertId;
  }

  static async findByAppointmentId(appointmentId) {
    const query = 'SELECT * FROM reviews WHERE appointment_id = ?';
    const [rows] = await db.execute(query, [appointmentId]);
    return rows[0] || null;
  }

  static async findByDoctorId(doctorId) {
    const query = `
      SELECT r.*, u.name as patient_name, a.id as appointment_id
      FROM reviews r
      JOIN users u ON r.patient_id = u.id
      JOIN appointments a ON r.appointment_id = a.id
      WHERE r.doctor_id = ?
      ORDER BY r.created_at DESC
    `;
    const [rows] = await db.execute(query, [doctorId]);
    return rows;
  }

  static async update(id, rating, comment) {
    const query = 'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?';
    const [result] = await db.execute(query, [rating, comment, id]);
    return result.affectedRows > 0;
  }
}

module.exports = ReviewModel;
