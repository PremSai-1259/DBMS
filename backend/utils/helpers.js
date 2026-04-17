const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Calculate file hash
const calculateFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'healthcare@example.com',
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  doctorApproved: (doctorName) => ({
    subject: 'Your Doctor Profile Has Been Approved',
    html: `
      <h2>Welcome, Dr. ${doctorName}!</h2>
      <p>Your doctor profile has been approved by admin.</p>
      <p>You can now:</p>
      <ul>
        <li>Generate appointment slots</li>
        <li>Manage appointments</li>
        <li>Request patient medical records</li>
      </ul>
      <p>Best regards,<br>Healthcare Platform Team</p>
    `
  }),

  doctorRejected: (doctorName, reason) => ({
    subject: 'Your Doctor Profile Application - Update Required',
    html: `
      <h2>Hello, Dr. ${doctorName}!</h2>
      <p>Your doctor profile application requires updates:</p>
      <p><strong>Reason:</strong> ${reason || 'Please review your documents'}</p>
      <p>Please reapply after addressing the concerns.</p>
      <p>Best regards,<br>Healthcare Platform Team</p>
    `
  }),

  appointmentCancelled: (patientName, doctorName, reason) => ({
    subject: 'Your Appointment Has Been Cancelled',
    html: `
      <h2>Appointment Cancellation Notice</h2>
      <p>Hello ${patientName},</p>
      <p>Your appointment with Dr. ${doctorName} has been cancelled.</p>
      <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
      <p>Please book another appointment at your earliest convenience.</p>
      <p>Best regards,<br>Healthcare Platform Team</p>
    `
  }),

  accessApproved: (patientName, doctorName) => ({
    subject: 'Medical Record Access Granted',
    html: `
      <h2>Record Access Approved</h2>
      <p>Hello Dr. ${doctorName},</p>
      <p>${patientName} has approved your access to their medical records.</p>
      <p>You can now view their records in the system.</p>
      <p>Best regards,<br>Healthcare Platform Team</p>
    `
  }),

  accessRejected: (patientName, doctorName) => ({
    subject: 'Medical Record Access Denied',
    html: `
      <h2>Record Access Denied</h2>
      <p>Hello Dr. ${doctorName},</p>
      <p>${patientName} has denied your request to access their medical records.</p>
      <p>Best regards,<br>Healthcare Platform Team</p>
    `
  })
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  calculateFileHash,
  sendEmail,
  emailTemplates
};
