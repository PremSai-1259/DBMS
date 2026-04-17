const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileModel = require('../models/File');
const { calculateFileHash } = require('../utils/helpers');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, PNG allowed'), false);
  }
};

// Multer middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

class FileController {
  static async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user.id;
      const { fileType } = req.body;

      // Validation
      if (!fileType || !['certificate', 'medical_report', 'profile_image'].includes(fileType)) {
        return res.status(400).json({ error: 'Invalid fileType. Must be certificate, medical_report, or profile_image' });
      }

      // Read file and calculate hash
      const fileBuffer = fs.readFileSync(req.file.path);
      const hashValue = calculateFileHash(fileBuffer);

      // Save to database
      const fileId = await FileModel.create(
        userId,
        req.file.originalname,
        req.file.path,
        fileType,
        hashValue
      );

      res.status(201).json({
        message: 'File uploaded successfully',
        fileId,
        fileName: req.file.originalname,
        fileType
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getFile(req, res) {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get file info
      const file = await FileModel.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Authorization: User can only download their own files or approved medical records
      if (file.user_id !== userId && userRole !== 'admin') {
        // Check if doctor has approved access
        if (userRole === 'doctor') {
          const RecordAccessModel = require('../models/RecordAccess');
          const access = await RecordAccessModel.checkApprovedAccess(userId, fileId);
          if (!access) {
            return res.status(403).json({ error: 'Access denied to this file' });
          }
        } else {
          return res.status(403).json({ error: 'Access denied to this file' });
        }
      }

      // Check if file exists on disk
      if (!fs.existsSync(file.file_path)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      // Send file
      res.download(file.file_path, file.file_name);
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;

      // Get file info
      const file = await FileModel.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Only owner can delete
      if (file.user_id !== userId) {
        return res.status(403).json({ error: 'Only file owner can delete' });
      }

      // Delete from disk
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }

      // Delete from database
      await FileModel.delete(fileId);

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = { FileController, upload };
