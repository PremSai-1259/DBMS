const db = require("../configs/db");

// ================= PATIENT SECTION =================

// Check if a profile exists for a user
const getPatientByUserId = async (userId) => {
  const [rows] = await db.query(
    "SELECT * FROM PATIENTS WHERE user_id = ?",
    [userId]
  );
  return rows[0]; 
};

// Insert a brand new profile
const createPatientProfile = async (data) => {
  const { user_id, full_name, gender, date_of_birth, phone, email, address, blood_group } = data;
  
  const [result] = await db.query(
    `INSERT INTO PATIENTS 
    (user_id, full_name, gender, date_of_birth, phone, email, address, blood_group) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, full_name, gender, date_of_birth, phone, email, address, blood_group]
  );
  return result;
};

// Update existing profile fields
const updatePatientProfile = async (userId, data) => {
  const { full_name, gender, date_of_birth, phone, email, address, blood_group } = data;
  
  const [result] = await db.query(
    `UPDATE PATIENTS SET 
    full_name = ?, gender = ?, date_of_birth = ?, 
    phone = ?, email = ?, address = ?, blood_group = ? 
    WHERE user_id = ?`,
    [full_name, gender, date_of_birth, phone, email, address, blood_group, userId]
  );
  return result;
};

// ================= DOCTOR SECTION =================

// Check if a doctor profile exists
const getDoctorByUserId = async (userId) => {
  const [rows] = await db.query(
    "SELECT * FROM DOCTORS WHERE user_id = ?",
    [userId]
  );
  return rows[0];
};

// Insert a brand new doctor profile
const createDoctorProfile = async (data) => {
  const { user_id, full_name, specialization, phone, email, experience_years, consultation_fee } = data;
  
  const [result] = await db.query(
    `INSERT INTO DOCTORS 
    (user_id, full_name, specialization, phone, email, experience_years, consultation_fee) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_id, full_name, specialization, phone, email, experience_years, consultation_fee]
  );
  return result;
};

// Update existing doctor profile
const updateDoctorProfile = async (userId, data) => {
  const { full_name, specialization, phone, email, experience_years, consultation_fee } = data;
  
  const [result] = await db.query(
    `UPDATE DOCTORS SET 
    full_name = ?, specialization = ?, phone = ?, 
    email = ?, experience_years = ?, consultation_fee = ? 
    WHERE user_id = ?`,
    [full_name, specialization, phone, email, experience_years, consultation_fee, userId]
  );
  return result;
};

module.exports = {
  getPatientByUserId,
  createPatientProfile,
  updatePatientProfile,
  getDoctorByUserId,
  createDoctorProfile,
  updateDoctorProfile
};