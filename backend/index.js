require('dotenv').config(); // 🔥 MUST BE FIRST LINE
const express = require('express');
const db = require("./configs/db");

// Import all route files
const authroutes = require("./routes/authroutes");
const availabilityRoutes = require("./routes/availabilityroutes");
const appointmentRoutes = require("./routes/appointmentroutes");
const profileRoutes = require("./routes/profileroutes"); // 👈 NEW

const app = express();
const port = 3000;

app.use(express.json());

// ================= ROUTE MOUNTING =================

// Auth Routes (Login/Register usually stay at root or /api/auth)
app.use("/", authroutes);

// Resource Routes (All prefixed with /api for consistency)
app.use("/api", availabilityRoutes);
app.use("/api", appointmentRoutes);
app.use("/api/profile", profileRoutes); // 👈 NEW: Mounts /me and /upsert here

// =================================================

app.listen(port, () => {
  console.log(`SERVER IS RUNNING ON PORT ${port}`);
});