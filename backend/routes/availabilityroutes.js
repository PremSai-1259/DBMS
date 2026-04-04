const express = require("express");
const router = express.Router();
const verifytoken = require("../middleware/authmiddleware");
const checkRole = require("../middleware/rolemiddleware");
const {
  setAvailability,
  getFreeSlots,
} = require("../controllers/availabilitycontroller");

router.post("/availability", verifytoken,checkRole("DOCTOR"),setAvailability);
router.get("/doctor/:id/slots", getFreeSlots);

module.exports = router;