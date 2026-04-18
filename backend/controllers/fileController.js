const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileModel = require('../models/File');
const { calculateFileHash } = require('../utils/helpers');

// Create storage directory if it doesn't exist
const uploadsDir = path.resolve('C:/Users/shiva kumar/Desktop/storage');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Storage directory created at:', uploadsDir);
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for certificates
});

class FileController {
  static async uploadFile(req, res) {
    try {
      console.log('Upload request received:');
      console.log('  - File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'MISSING');
      console.log('  - Body:', req.body);
      console.log('  - Headers Content-Type:', req.headers['content-type']);

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user.id;
      const { fileType } = req.body;

      console.log('  - UserId:', userId);
      console.log('  - FileType:', fileType);

      // Validation
      if (!fileType || !['medical_report', 'certificate'].includes(fileType)) {
        return res.status(400).json({ error: 'Invalid fileType. Must be medical_report or certificate' });
      }

      // Adjust file size limit based on type
      const fileSizeLimit = fileType === 'certificate' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for certificate, 5MB for medical report
      if (req.file.size > fileSizeLimit) {
        return res.status(400).json({ error: `File size exceeds limit of ${fileSizeLimit / (1024*1024)}MB` });
      }

      // Read file and calculate hash
      const fileBuffer = fs.readFileSync(req.file.path);
      const hashValue = calculateFileHash(fileBuffer);

      // Use original file name
      const displayFileName = req.file.originalname;

      // Save to database
      const fileId = await FileModel.create(
        userId,
        displayFileName,
        req.file.path,
        fileType,
        hashValue
      );

      res.status(201).json({
        message: 'File uploaded successfully',
        fileId,
        fileName: displayFileName,
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

  static async getFileInfo(req, res) {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get file info
      const file = await FileModel.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Authorization: Admin can view any file info, user can only view their own
      if (file.user_id !== userId && userRole !== 'admin') {
        return res.status(403).json({ error: 'Access denied to this file' });
      }

      // Check if file exists on disk
      if (!fs.existsSync(file.file_path)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      // Return file info
      const fileStats = fs.statSync(file.file_path);
      res.json({
        fileId: file.id,
        fileName: file.file_name,
        fileType: file.file_type,
        fileSize: fileStats.size,
        uploadedAt: file.created_at,
        uploadedBy: file.user_id
      });
    } catch (error) {
      console.error('Get file info error:', error);
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

  static async listUserFiles(req, res) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      console.log('[listUserFiles] Auth info:', { userId, userRole });
      console.log('[listUserFiles] req.user object:', req.user);
      console.log('[listUserFiles] Fetching files for userId:', userId);
      
      if (!userId) {
        console.error('[listUserFiles] No userId found in request');
        return res.status(401).json({ error: 'Unauthorized - no user ID' });
      }

      const FileModel = require('../models/File');

      // Get all medical report files for the user
      const files = await FileModel.findByUserIdAndType(userId, 'medical_report');
      console.log('[listUserFiles] Files found count:', files?.length || 0);
      console.log('[listUserFiles] Files:', files);

      res.status(200).json({
        message: 'Files retrieved successfully',
        files: files || [],
        debug: {
          userId: userId,
          fileCount: files?.length || 0,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[listUserFiles] Error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = { FileController, upload };
