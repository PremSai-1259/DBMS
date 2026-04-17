const db = require('../configs/db');

class ConsultationNoteModel {
  static async create(appointmentId, doctorId, patientId, reasonForVisit, diagnosis, prescription, additionalNotes) {
    const query = `
      INSERT INTO consultation_notes 
      (appointment_id, doctor_id, patient_id, reason_for_visit, diagnosis, prescription, additional_notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, 
      [appointmentId, doctorId, patientId, reasonForVisit, diagnosis, prescription, additionalNotes]
    );
    return result.insertId;
  }

  static async findByAppointmentId(appointmentId) {
    const query = 'SELECT * FROM consultation_notes WHERE appointment_id = ?';
    const [rows] = await db.execute(query, [appointmentId]);
    return rows[0] || null;
  }

  static async findById(id) {
    const query = 'SELECT * FROM consultation_notes WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }

  static async update(id, reasonForVisit, diagnosis, prescription, additionalNotes) {
    const query = `
      UPDATE consultation_notes 
      SET reason_for_visit = ?, diagnosis = ?, prescription = ?, additional_notes = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, 
      [reasonForVisit, diagnosis, prescription, additionalNotes, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ConsultationNoteModel;
