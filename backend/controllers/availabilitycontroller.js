const {
  insertSlot,
  getAvailableSlots
} = require("../models/availabilitymodel");

const { getBookedSlots } = require("../models/appointmentmodel");

const getSlotTime = require("../utils/getslottime");
const getStatus = require("../utils/getstatus");


// ================= SET AVAILABILITY =================
const setAvailability = async (req, res) => {
  const doctor_id = req.user.id;
  const { date, slots } = req.body;

  try {
    if (!date || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        message: "date and slots are required"
      });
    }

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

    for (let slot of newSlots) {
      await insertSlot(doctor_id, date, slot);
    }

    if (duplicateSlots.length > 0) {
      return res.json({
        message: "Some slots added, some were duplicates",
        added: newSlots,
        duplicates: duplicateSlots
      });
    }

    res.json({
      message: "All slots added successfully",
      added: newSlots
    });

  } catch (err) {
    console.log(err);
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
      const time = getSlotTime(slot);

      let status = getStatus(date, slot);

      // 🔥 booking only affects upcoming
      if (status === "upcoming" && bookedSet.has(slot)) {
        status = "booked";
      }

      return {
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

    res.json({ slots });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  setAvailability,
  getFreeSlots
};