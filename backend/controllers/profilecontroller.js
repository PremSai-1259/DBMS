const PatientProfileModel = require('../models/PatientProfile');
const DoctorProfileModel = require('../models/DoctorProfile');
const UserModel = require('../models/User');

/**
 * ⚠️  PROFILE DATA STORAGE POLICY
 * 
 * DOCTOR PROFILE DATA STORAGE RULE:
 * ✅ Stored ONLY in: doctor_profiles table
 * ❌ Never stored in: users table, doctor_approvals table, or anywhere else
 * 
 * Data Flow:
 * 1. Doctor submits: specialization, experience, hospitalName, address
 * 2. Controller validates strictly (no nulls, proper types)
 * 3. Data inserted/updated in doctor_profiles table ONLY
 * 4. doctor_approvals table only stores: doctor_id, certificate_file_id, status, dates
 * 5. doctor_approvals table JOINs to doctor_profiles to retrieve profile data when needed
 */

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
      let { specialization, experience, hospitalName, address, certificateFileId } = req.body;
      const userId = req.user.id;

      // Trim all string inputs first
      specialization = specialization ? String(specialization).trim() : '';
      hospitalName = hospitalName ? String(hospitalName).trim() : '';
      address = address ? String(address).trim() : '';

      // STRICT validation - reject ANY empty or invalid values
      if (!specialization || specialization === '' || specialization.length < 3) {
        return res.status(400).json({ 
          error: 'Specialization is required, must be text, and at least 3 characters',
          received: specialization 
        });
      }

      if (experience === undefined || experience === null || experience === '' || isNaN(parseInt(experience))) {
        return res.status(400).json({ 
          error: 'Experience is required and must be a valid number',
          received: experience 
        });
      }

      const expNum = parseInt(experience);
      if (expNum < 0 || expNum > 70) {
        return res.status(400).json({ 
          error: 'Experience must be between 0 and 70 years',
          received: expNum 
        });
      }

      if (!hospitalName || hospitalName === '' || hospitalName.length < 2) {
        return res.status(400).json({ 
          error: 'Hospital/Clinic name is required and at least 2 characters',
          received: hospitalName 
        });
      }

      if (!address || address === '' || address.length < 10) {
        return res.status(400).json({ 
          error: 'Address is required and at least 10 characters',
          received: address 
        });
      }

      // Check if profile exists
      const existing = await DoctorProfileModel.findByUserId(userId);
      
      if (existing) {
        // Profile exists - always UPDATE to ensure no NULL values persist
        const updateData = {
          specialization,
          experience: expNum,
          hospitalName,
          address
        };
        if (certificateFileId) {
          updateData.certificateFileId = certificateFileId;
        }

        await DoctorProfileModel.updateProfile(userId, updateData);
        return res.status(200).json({
          message: 'Doctor profile updated successfully',
          profileId: existing.id,
          profile: { userId, specialization, experience: expNum, hospitalName, address, certificateFileId: existing.certificate_file_id, isVerified: existing.is_verified }
        });
      }

      // Create new profile (only if doesn't exist)
      // NOTE: certificateFileId is NOT required during profile creation
      // It will be added later when doctor uploads certificate
      const profileId = await DoctorProfileModel.create(userId, specialization, expNum, hospitalName, address);

      res.status(201).json({
        message: 'Doctor profile created successfully. Now upload your certificate.',
        profileId,
        profile: { userId, specialization, experience: expNum, hospitalName, address, certificateFileId: null, isVerified: false }
      });
    } catch (error) {
      // Handle duplicate profile error gracefully
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
          error: 'Doctor profile already exists for this user. Please use update endpoint.',
          suggestion: 'Your profile already exists. If you want to update it, please resubmit the form.'
        });
      }
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
      const { specialization, experience, hospitalName, address } = req.body;

      // Strict validation for updates
      if (specialization !== undefined && (typeof specialization !== 'string' || specialization.trim().length === 0)) {
        return res.status(400).json({ error: 'Specialization must be valid text' });
      }
      if (experience !== undefined && experience !== null && (isNaN(parseInt(experience)) || parseInt(experience) < 0)) {
        return res.status(400).json({ error: 'Experience must be a valid number' });
      }
      if (hospitalName !== undefined && (typeof hospitalName !== 'string' || hospitalName.trim().length === 0)) {
        return res.status(400).json({ error: 'Hospital name must be valid text' });
      }
      if (address !== undefined && (typeof address !== 'string' || address.trim().length === 0)) {
        return res.status(400).json({ error: 'Address must be valid text' });
      }

      // Check if profile exists
      const existing = await DoctorProfileModel.findByUserId(userId);
      if (!existing) {
        return res.status(404).json({ error: 'Doctor profile not found' });
      }

      // Prepare clean update data
      const cleanUpdateData = {};
      if (specialization) cleanUpdateData.specialization = specialization.trim();
      if (experience !== undefined && experience !== null) cleanUpdateData.experience = parseInt(experience);
      if (hospitalName) cleanUpdateData.hospitalName = hospitalName.trim();
      if (address) cleanUpdateData.address = address.trim();

      // Update profile only if there's data to update
      if (Object.keys(cleanUpdateData).length > 0) {
        await DoctorProfileModel.updateProfile(userId, cleanUpdateData);
      }

      res.json({
        message: 'Doctor profile updated successfully',
        profile: { ...existing, ...cleanUpdateData }
      });
    } catch (error) {
      console.error('Update doctor profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProfileController;
