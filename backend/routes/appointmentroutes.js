const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authmiddleware");
const checkRole = require("../middleware/rolemiddleware")
const {
  bookAppointment,
  getBookings,
} = require("../controllers/appointmentcontroller");

router.post("/appointments",verifyToken, bookAppointment);
router.get("/doctor/bookings",verifyToken,checkRole("DOCTOR"), getBookings);

module.exports = router;