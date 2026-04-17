const db = require('../configs/db');

class UserModel {
  static async create(name, email, hashedPassword, role) {
    const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    const [result] = await db.execute(query, [name, email, hashedPassword, role]);
    return result.insertId;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  }

  static async findByIdAndRole(id, role) {
    const query = 'SELECT * FROM users WHERE id = ? AND role = ?';
    const [rows] = await db.execute(query, [id, role]);
    return rows[0] || null;
  }
}

module.exports = UserModel;
