const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const FileModel = require('../models/File');
const { calculateFileHash } = require('../utils/helpers');

// Create storage directory if it doesn't exist
const uploadsDir = path.resolve('C:/Users/shiva kumar/Desktop/storage');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Storage directory created at:', uploadsDir);
}

// Multer storage configuration with temporary naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate temporary filename (will be renamed after upload)
    const tempName = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, tempName);
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

const getInlineMimeType = (file) => {
  const ext = path.extname(file?.file_name || file?.file_path || '').toLowerCase();

  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
};

class FileController {
  static async uploadFile(req, res) {
    try {
      console.log('\n=== FILE UPLOAD REQUEST RECEIVED ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Headers Content-Type:', req.headers['content-type']);
      console.log('Headers Authorization:', req.headers.authorization ? '✅ Present' : '❌ Missing');
      
      console.log('\nFile Info:');
      if (req.file) {
        console.log('  ✅ File found');
        console.log('    - Field name:', req.file.fieldname);
        console.log('    - Original name:', req.file.originalname);
        console.log('    - MIME type:', req.file.mimetype);
        console.log('    - Size:', req.file.size, 'bytes');
        console.log('    - Path:', req.file.path);
      } else {
        console.log('  ❌ NO FILE in request');
      }
      
      console.log('\nBody (parsed fields):');
      console.log('  fileType:', req.body.fileType || '❌ Missing');
      console.log('  All body keys:', Object.keys(req.body));
      
      console.log('\nUser Info:');
      console.log('  User ID:', req.user?.id || '❌ Missing (auth may have failed)');
      console.log('  User Role:', req.user?.role || 'N/A');
      console.log('===============================\n');

      // Validation: File must exist
      if (!req.file) {
        console.error('❌ VALIDATION FAILED: No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user?.id;
      const { fileType } = req.body;

      // Validation: User ID must exist
      if (!userId) {
        console.error('❌ VALIDATION FAILED: No userId (auth middleware issue)');
        return res.status(401).json({ error: 'Unauthorized - no user' });
      }

      // Validation: fileType is required and valid
      if (!fileType) {
        console.error('❌ VALIDATION FAILED: Missing fileType in body');
        console.error('   Available keys in req.body:', Object.keys(req.body));
        return res.status(400).json({ error: 'fileType is required' });
      }

      if (!['medical_report', 'certificate'].includes(fileType)) {
        console.error(`❌ VALIDATION FAILED: Invalid fileType: "${fileType}"`);
        console.error(`   Allowed values: medical_report, certificate`);
        return res.status(400).json({ error: 'fileType must be medical_report or certificate' });
      }

      // Validation: Check file size based on type
      const fileSizeLimit = fileType === 'certificate' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (req.file.size > fileSizeLimit) {
        const limitMB = fileSizeLimit / (1024*1024);
        const sizeMB = req.file.size / (1024*1024);
        console.error(`❌ VALIDATION FAILED: File size ${sizeMB.toFixed(2)}MB exceeds limit of ${limitMB}MB`);
        return res.status(400).json({ error: `File must be less than ${limitMB}MB` });
      }

      // Validation: Check file mimetype
      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        console.error(`❌ VALIDATION FAILED: Invalid mimetype: "${req.file.mimetype}"`);
        console.error(`   Allowed types: ${allowedMimes.join(', ')}`);
        return res.status(400).json({ error: 'Only PDF, JPEG, PNG files allowed' });
      }

      // Read file and calculate hash
      const fileBuffer = fs.readFileSync(req.file.path);
      const hashValue = calculateFileHash(fileBuffer);
      
      // Generate hashed filename with proper extension
      const fileExt = path.extname(req.file.originalname);
      const hashedFileName = `${hashValue}${fileExt}`;
      const hashedFilePath = path.join(uploadsDir, hashedFileName);
      
      // Rename temp file to hashed filename
      fs.renameSync(req.file.path, hashedFilePath);
      console.log(`✅ File renamed from temp to hashed: ${path.basename(hashedFilePath)}`);

      // Save to database with hashed path
      const fileId = await FileModel.create(
        userId,
        req.file.originalname,
        hashedFilePath,
        fileType,
        hashValue
      );

      console.log('✅ File uploaded successfully:', { 
        fileId, 
        fileName: req.file.originalname, 
        hashedFileName,
        fileType,
        hash: hashValue.substring(0, 16) + '...'
      });

      res.status(201).json({
        message: 'File uploaded successfully',
        fileId,
        fileName: req.file.originalname,
        fileType,
        hashedFileName
      });
    } catch (error) {
      console.error('❌ File upload error:', error);
      // Clean up temp file if rename failed
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('Could not clean up temp file:', e.message);
        }
      }
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }

  static async getFile(req, res) {
    try {
      const { fileId } = req.params;
      let userId = req.user?.id;
      let userRole = req.user?.role;

      // If no user from middleware, try to extract from query parameter token
      if (!userId && req.query.token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
          userId = decoded.id;
          userRole = decoded.role;
          console.log(`[getFile] User authenticated via query token: ${userId}, role: ${userRole}`);
        } catch (tokenError) {
          console.error('[getFile] Invalid query token:', tokenError.message);
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
      }

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log(`[getFile] Attempting to download file ${fileId}, User: ${userId}, Role: ${userRole}`);

      // Get file info
      const file = await FileModel.findById(fileId);
      if (!file) {
        console.log(`[getFile] File ${fileId} not found`);
        return res.status(404).json({ error: 'File not found' });
      }

      // Authorization logic:
      // 1. Admin can download ANY file (for approval process)
      // 2. User can download their own files
      // 3. Doctor can download approved patient records
      
      if (userRole === 'admin') {
        // ✅ Admin can access any file
        console.log(`[getFile] Admin access granted to file ${fileId}`);
      } else if (file.user_id === userId) {
        // ✅ User can access their own files
        console.log(`[getFile] Owner access granted to file ${fileId}`);
      } else if (userRole === 'doctor') {
        // Check if doctor has approved access to patient records
        const RecordAccessModel = require('../models/RecordAccess');
        const access = await RecordAccessModel.checkApprovedAccess(userId, fileId);
        if (!access) {
          console.log(`[getFile] Doctor access denied to file ${fileId}`);
          return res.status(403).json({ error: 'Access denied to this file' });
        }
        console.log(`[getFile] Doctor approved access granted to file ${fileId}`);
      } else {
        console.log(`[getFile] Access denied for role ${userRole} to file ${fileId}`);
        return res.status(403).json({ error: 'Access denied to this file' });
      }

      // Check if file exists on disk
      if (!fs.existsSync(file.file_path)) {
        console.error(`[getFile] File not found on disk: ${file.file_path}`);
        return res.status(404).json({ error: 'File not found on server' });
      }

      console.log(`[getFile] Downloading file: ${file.file_name} from ${file.file_path}`);

      // Send file
      res.download(file.file_path, file.file_name);
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async previewFile(req, res) {
    try {
      const { fileId } = req.params;
      let userId = req.user?.id;
      let userRole = req.user?.role;

      if (!userId && req.query.token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
          userId = decoded.id;
          userRole = decoded.role;
        } catch (tokenError) {
          return res.status(401).json({ error: 'Invalid authentication token' });
        }
      }

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const file = await FileModel.findById(fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (userRole !== 'admin' && file.user_id !== userId) {
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

      if (!fs.existsSync(file.file_path)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      const contentType = getInlineMimeType(file);
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
      res.sendFile(path.resolve(file.file_path));
    } catch (error) {
      console.error('Preview file error:', error);
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
