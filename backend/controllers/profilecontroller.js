const {
  getPatientByUserId,
  createPatientProfile,
  updatePatientProfile,
  getDoctorByUserId,
  createDoctorProfile,
  updateDoctorProfile
} = require("../models/profilemodel");

// ================= UPSERT PROFILE (PATIENT & DOCTOR) =================
const upsertProfile = async (req, res) => {
  const userId = req.user.id; 
  const role = req.user.role; // This is 'PATIENT' or 'DOCTOR' from your token
  const data = req.body;

  try {
    // --- PATIENT LOGIC ---
    if (role === 'PATIENT') {
      const patientData = {
        user_id: userId,
        full_name: data.fullName,
        gender: data.gender ? data.gender.toUpperCase() : null,
        date_of_birth: data.dob,
        phone: data.phone,
        email: data.email,
        address: data.address,
        blood_group: data.bloodGroup
      };

      const existing = await getPatientByUserId(userId);
      if (existing) {
        await updatePatientProfile(userId, patientData);
      } else {
        await createPatientProfile(patientData);
      }

      const updated = await getPatientByUserId(userId);
      return res.json({ success: true, message: existing ? "Patient profile updated" : "Patient profile created", data: updated });
    }

    // --- DOCTOR LOGIC ---
    if (role === 'DOCTOR') {
      const doctorData = {
        user_id: userId,
        full_name: data.fullName,
        specialization: data.specialization,
        phone: data.phone,
        email: data.email,
        experience_years: data.experienceYears,
        consultation_fee: data.consultationFee
      };

      const existing = await getDoctorByUserId(userId);
      if (existing) {
        await updateDoctorProfile(userId, doctorData);
      } else {
        await createDoctorProfile(doctorData);
      }

      const updated = await getDoctorByUserId(userId);
      return res.json({ success: true, message: existing ? "Doctor profile updated" : "Doctor profile created", data: updated });
    }

    // If role is neither
    res.status(403).json({ message: "Invalid role for profile creation" });

  } catch (err) {
    console.error("Controller Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET PROFILE (PATIENT & DOCTOR) =================
const getMyProfile = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let profile;
    if (role === 'PATIENT') {
      profile = await getPatientByUserId(userId);
    } else if (role === 'DOCTOR') {
      profile = await getDoctorByUserId(userId);
    }

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ success: true, data: profile });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  upsertProfile,
  getMyProfile
};