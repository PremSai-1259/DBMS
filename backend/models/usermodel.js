const db = require("../configs/db");

// Create user
const createUser = async (name, email, password, role) => {
  await db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, role]
  );
};

// Find user
const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email=?",
    [email]
  );
  return rows;
};

module.exports = {
  createUser,
  findUserByEmail,
};