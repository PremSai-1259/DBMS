const PatientProfileModel = require('../models/PatientProfile');
const DoctorProfileModel = require('../models/DoctorProfile');
const UserModel = require('../models/User');

class ProfileController {
  // Patient Profile
  static async createPatientProfile(req, res) {
    try {
      const { age, gender, phone, bloodGroup } = req.body;
      const userId = req.user.id;

      // Validation
      if (!age || !gender || !phone || !bloodGroup) {
        return res.status(400).json({ error: 'Missing required fields: age, gender, phone, bloodGroup' });
      }

      // Check if profile exists
      const existing = await PatientProfileModel.findByUserId(userId);
      if (existing) {
        return res.status(409).json({ error: 'Patient profile already exists' });
      }

      // Create profile
      const profileId = await PatientProfileModel.create(userId, age, gender, phone, bloodGroup);

      res.status(201).json({
        message: 'Patient profile created successfully',
        profileId,
        profile: { userId, age, gender, phone, bloodGroup }
      });
    } catch (error) {
      console.error('Create patient profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getPatientProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await PatientProfileModel.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }

      const user = await UserModel.findById(userId);

      res.json({
        profile: {
          ...profile,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Get patient profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updatePatientProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Check if profile exists
      const existing = await PatientProfileModel.findByUserId(userId);
      if (!existing) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }

      // Update profile
      await PatientProfileModel.updateProfile(userId, updateData);

      res.json({
        message: 'Patient profile updated successfully'
      });
    } catch (error) {
      console.error('Update patient profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Doctor Profile
  static async createDoctorProfile(req, res) {
    try {
      const { specialization, experience, hospitalName, address } = req.body;
      const userId = req.user.id;

      // Validation
      if (!specialization || experience === undefined || !hospitalName || !address) {
        return res.status(400).json({ error: 'Missing required fields: specialization, experience, hospitalName, address' });
      }

      // Check if profile exists
      const existing = await DoctorProfileModel.findByUserId(userId);
      if (existing) {
        return res.status(409).json({ error: 'Doctor profile already exists' });
      }

      // Create profile
      const profileId = await DoctorProfileModel.create(userId, specialization, experience, hospitalName, address);

      res.status(201).json({
        message: 'Doctor profile created successfully',
        profileId,
        profile: { userId, specialization, experience, hospitalName, address, isVerified: false }
      });
    } catch (error) {
      console.error('Create doctor profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getDoctorProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await DoctorProfileModel.findByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Doctor profile not found' });
      }

      const user = await UserModel.findById(userId);

      res.json({
        profile: {
          ...profile,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Get doctor profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updateDoctorProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Check if profile exists
      const existing = await DoctorProfileModel.findByUserId(userId);
      if (!existing) {
        return res.status(404).json({ error: 'Doctor profile not found' });
      }

      // Update profile
      await DoctorProfileModel.updateProfile(userId, updateData);

      res.json({
        message: 'Doctor profile updated successfully'
      });
    } catch (error) {
      console.error('Update doctor profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProfileController;
