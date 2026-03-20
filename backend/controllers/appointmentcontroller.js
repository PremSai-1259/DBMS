const {
  createAppointment,
  getDoctorBookings,
} = require("../models/appointmentmodel");

const { getAvailableSlots } = require("../models/availabilitymodel");

const getSlotTime = require("../utils/getslottime");
const getStatus = require("../utils/getstatus");


// ================= BOOK APPOINTMENT =================
const bookAppointment = async (req, res) => {
  const patient_id = req.user.id;
  let { doctor_id, date, slot_number } = req.body;

  try {
    // ✅ Validate input
    if (!doctor_id || !date || !slot_number) {
      return res.status(400).json({
        message: "doctor_id, date, slot_number are required"
      });
    }

    slot_number = Number(slot_number);

    // ✅ Check availability exists
    const availableSlots = await getAvailableSlots(doctor_id, date);

    if (!availableSlots || availableSlots.length === 0) {
      return res.status(400).json({
        message: "Doctor has not set availability for this date"
      });
    }

    const isAvailable = availableSlots.some(
      s => Number(s.slot_number) === slot_number
    );

    if (!isAvailable) {
      return res.status(400).json({
        message: "Slot not available"
      });
    }

    // ✅ Prevent booking past or running slots
    const status = getStatus(date, slot_number);

    if (status === "running" || status === "completed") {
      return res.status(400).json({
        message: "Cannot book running or completed slots"
      });
    }

    // ✅ Insert booking (DB handles duplicate)
    await createAppointment(doctor_id, patient_id, date, slot_number);

    return res.json({
      message: "Appointment booked successfully"
    });

  } catch (err) {
    console.log("BOOK ERROR:", err);

    // ✅ Duplicate booking
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "Slot already booked"
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
  const doctor_id = req.user.id;
  const { date } = req.query;

  try {
    // ✅ Date mandatory
    if (!date) {
      return res.status(400).json({
        message: "date query parameter is required"
      });
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
        id: b.id,
        doctor_id: b.doctor_id,
        patient_id: b.patient_id,

        // ✅ FIX: prevent timezone issue
        date: b.date,

        slot_number: b.slot_number,
        start: time.start,
        end: time.end,

        // ✅ unified status logic
        status: getStatus(b.date, b.slot_number)
      };
    });

    return res.json({
      total: result.length,
      bookings: result
    });

  } catch (err) {
    console.log("GET BOOKINGS ERROR:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

module.exports = {
  bookAppointment,
  getBookings,
};