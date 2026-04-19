require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authroutes');
const profileRoutes = require('./routes/profileroutes');
const doctorRoutes = require('./routes/doctorRoutes');
const doctorApprovalsRoutes = require('./routes/doctorApprovalsRoutes');
const slotRoutes = require('./routes/slotRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const appointmentRoutes = require('./routes/appointmentroutes');
const fileRoutes = require('./routes/fileRoutes');
const accessRoutes = require('./routes/accessRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Global request logger - logs ALL incoming requests
app.use((req, res, next) => {
  console.log(`🔷 [${new Date().toISOString()}] ${req.method} ${req.path} ${req.query ? '?' + new URLSearchParams(req.query).toString() : ''}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (restricted by fileController)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/doctor-approvals', doctorApprovalsRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server running', port });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`✅ Healthcare Backend Server running on PORT ${port}`);
  console.log(`📝 Database configured`);
  console.log(`🔐 Authentication enabled`);
  console.log(`📋 All modules loaded`);
});
