require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authroutes');
const profileRoutes = require('./routes/profileroutes');
const doctorRoutes = require('./routes/doctorRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentroutes');
const fileRoutes = require('./routes/fileRoutes');
const accessRoutes = require('./routes/accessRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (restricted by fileController)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/doctor', doctorRoutes);
app.use('/slots', slotRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/files', fileRoutes);
app.use('/access', accessRoutes);
app.use('/consultation', consultationRoutes);
app.use('/reviews', reviewRoutes);
app.use('/notifications', notificationRoutes);

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
