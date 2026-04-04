const express = require("express");
const router = express.Router();

// Importing your specific controller functions
const { 
  upsertProfile, 
  getMyProfile 
} = require("../controllers/profilecontroller"); // Ensure path/name matches your file

// Using "verifyToken" to match your appointment route consistency
const verifyToken = require("../middleware/authmiddleware");

/**
 * PATIENT PROFILE ROUTES
 * We use verifyToken here because the controller relies on 
 * req.user.id to identify which patient is performing the action.
 */

// GET /api/patient/me
// Fetches the profile for the logged-in user
router.get("/me", verifyToken, getMyProfile);

// POST /api/patient/upsert
// Handles both Create and Update logic
router.post("/upsert", verifyToken, upsertProfile);

module.exports = router;