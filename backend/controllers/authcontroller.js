const UserModel = require('../models/User');
const PatientProfileModel = require('../models/PatientProfile');
const DoctorProfileModel = require('../models/DoctorProfile');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');

class AuthController {
  static async signup(req, res) {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, password, role' });
      }

      if (!['patient', 'doctor'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "patient" or "doctor"' });
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Combine firstName and lastName into name
      const name = `${firstName} ${lastName}`;

      // Create user
      const userId = await UserModel.create(name, email, hashedPassword, role);

      // Generate token
      const user = { id: userId, email, role };
      const token = generateToken(user);

      res.status(201).json({
        message: 'Signup successful',
        userId,
        token,
        user: { id: userId, name, firstName, lastName, email, role }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
