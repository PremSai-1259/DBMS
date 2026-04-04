const {
  insertSlot,
  getAvailableSlots
} = require("../models/availabilitymodel");

const { getBookedSlots } = require("../models/appointmentmodel");
// Import the model to fetch doctor profile details
const { getDoctorByUserId } = require("../models/profilemodel"); 

const getSlotTime = require("../utils/getslottime");
const getStatus = require("../utils/getstatus");

// ================= SET AVAILABILITY =================
const setAvailability = async (req, res) => {
  const userId = req.user.id; // From verifyToken
  const { date, slots } = req.body;

  try {
    if (!date || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        message: "date and slots are required"
      });
    }

    // 1. Get the actual doctor_id from the profile table
    const doctorProfile = await getDoctorByUserId(userId);
    
    if (!doctorProfile) {
      return res.status(404).json({ 
        message: "Doctor profile not found. Please create a profile before setting availability." 
      });
    }

    const doctor_id = doctorProfile.doctor_id;

    // 2. Check existing slots for the specific doctor_id
    const existingSlotsData = await getAvailableSlots(doctor_id, date);

    const existingSlots = new Set(
      existingSlotsData.map(s => s.slot_number)
    );

    const duplicateSlots = slots.filter(s => existingSlots.has(s));
    const newSlots = slots.filter(s => !existingSlots.has(s));

    if (newSlots.length === 0) {
      return res.status(400).json({
        message: "All selected slots already exist",
        duplicates: duplicateSlots
      });
    }

    // 3. Insert using the correct doctor_id and dynamic times
    for (let slotNumber of newSlots) {
      const time = getSlotTime(slotNumber); // Use your utility for accurate times
      await insertSlot(doctor_id, date, slotNumber, time.start, time.end);
    }

    res.json({
      success: true,
      message: duplicateSlots.length > 0 ? "Some slots added, some were duplicates" : "All slots added successfully",
      added: newSlots,
      duplicates: duplicateSlots
    });

  } catch (err) {
    console.error("Set Availability Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET SLOTS =================
const getFreeSlots = async (req, res) => {
  const doctor_id = req.params.id;
  const { date } = req.query;

  try {
    if (!date) {
      return res.status(400).json({
        message: "date is required"
      });
    }

    const available = await getAvailableSlots(doctor_id, date);
    const booked = await getBookedSlots(doctor_id, date);

    const bookedSet = new Set(booked.map(r => r.slot_number));

    const slots = available.map(r => {
      const slot = r.slot_number;
      const slot_id = r.slot_id; // Added this to include the ID from the database
      const time = getSlotTime(slot);

      let status = getStatus(date, slot);

      if (status === "upcoming" && bookedSet.has(slot)) {
        status = "booked";
      }

      return {
        slot_id, // Now returned in the response
        slot,
        start: time.start,
        end: time.end,
        status
      };
    });

    if (slots.length === 0) {
      return res.json({
        message: "No slots available for this date",
        slots: []
      });
    }

    slots.sort((a, b) => a.slot - b.slot);

    res.json({ success: true, slots });

  } catch (err) {
    console.error("Get Free Slots Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  setAvailability,
  getFreeSlots
};