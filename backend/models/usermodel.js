const db = require("../configs/db");

// name and email are treated as independent fields
const createUser = async (name, email, password, role) => {
  // 1. We insert 'name' into the 'username' column
  // 2. We insert 'email' into the 'email' column
  const [result] = await db.query(
    "INSERT INTO USERS (username, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, role.toUpperCase()]
  );
  
  return result.insertId;
};

// Find User by Email
const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM USERS WHERE email = ?",
    [email]
  );
  return rows;
};

module.exports = {
  createUser,
  findUserByEmail,
};