const {
  checkSlotBooked,
  createAppointment,
  getBookedSlots,
  getDoctorBookings,
  getDoctorIdByUserId, // Added this import
} = require("../models/appointmentmodel");

const { getAvailableSlots } = require("../models/availabilitymodel");
const db = require("../configs/db"); // Needed for the patient_id lookup

const getSlotTime = require("../utils/getslottime");
const getStatus = require("../utils/getstatus");

// ================= BOOK APPOINTMENT =================
const bookAppointment = async (req, res) => {
  const user_id = req.user.id; // This is the ID from the JWT token (e.g., 6)
  let { doctor_id, date, slot_number, slot_id, reason } = req.body;

  try {
    if (!doctor_id || !date || !slot_number || !slot_id) {
      return res.status(400).json({
        message: "doctor_id, date, slot_number, and slot_id are required"
      });
    }

    // 1. SILENT LOOKUP: Find the correct patient_id (e.g., 4) linked to this user_id (6)
    const [patientRows] = await db.query(
      "SELECT patient_id FROM PATIENTS WHERE user_id = ?", 
      [user_id]
    );

    if (patientRows.length === 0) {
      return res.status(404).json({
        message: "Patient profile not found. Please complete your profile first."
      });
    }

    const patient_id = patientRows[0].patient_id; // Now it correctly uses 4

    slot_number = Number(slot_number);

    // 2. CHECK AVAILABILITY
    const availableSlots = await getAvailableSlots(doctor_id, date);

    if (!availableSlots || availableSlots.length === 0) {
      return res.status(400).json({
        message: "Doctor has not set availability for this date"
      });
    }

    const isAvailable = availableSlots.some(
      s => Number(s.slot_number) === slot_number && s.is_booked === 0
    );

    if (!isAvailable) {
      return res.status(400).json({
        message: "Slot not available or already booked"
      });
    }

    // 3. CHECK STATUS
    const status = getStatus(date, slot_number);
    if (status === "running" || status === "completed") {
      return res.status(400).json({
        message: "Cannot book running or completed slots"
      });
    }

    // 4. FINAL INSERT: Using the actual patient_id from the PATIENTS table
    await createAppointment(doctor_id, patient_id, date, slot_number, slot_id, reason);

    return res.json({
      success: true,
      message: "Appointment booked successfully"
    });

  } catch (err) {
    console.log("BOOK ERROR:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "Slot already booked"
      });
    }

    // This handles the Foreign Key error specifically if something goes wrong
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
       return res.status(400).json({
        message: "Database Error: patient_id or slot_id does not exist."
      });
    }

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

// ================= DOCTOR BOOKINGS =================
const getBookings = async (req, res) => {
  const user_id = req.user.id; 
  const { date } = req.query;

  try {
    if (!date) {
      return res.status(400).json({ message: "date query parameter is required" });
    }

    // Use model to find doctor_id from the user_id in the token
    const doctor_id = await getDoctorIdByUserId(user_id);
    
    if (!doctor_id) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const bookings = await getDoctorBookings(doctor_id, date);

    if (!bookings || bookings.length === 0) {
      return res.json({
        message: "No bookings found for this date",
        bookings: []
      });
    }

    const result = bookings.map(b => {
      const time = getSlotTime(b.slot_number);
      return {
        appointment_id: b.appointment_id,
        patient_name: b.patient_name,
        patient_phone: b.patient_phone,
        slot_number: b.slot_number,
        time_range: `${time.start} - ${time.end}`,
        reason: b.reason,
        status: getStatus(b.appointment_date, b.slot_number)
      };
    });

    return res.json({
      success: true,
      total: result.length,
      bookings: result
    });

  } catch (err) {
    console.log("GET BOOKINGS ERROR:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  bookAppointment,
  getBookings,
};