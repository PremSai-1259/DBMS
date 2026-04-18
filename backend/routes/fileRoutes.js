const express = require('express');
const router = express.Router();
const { FileController, upload } = require('../controllers/fileController');
const authMiddleware = require('../middleware/authmiddleware');
const db = require('../configs/db');

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err && (err.name === 'MulterError' || err.message)) {
    console.error('Upload error:', err.message);
    return res.status(400).json({ error: `Upload failed: ${err.message}` });
  }
  next(err);
};

// DEBUG endpoint - Check database connection and get all files
router.get('/debug/all-files', async (req, res) => {
  try {
    console.log('DEBUG: Getting all files from database');
    const [rows] = await db.execute('SELECT * FROM files');
    console.log('DEBUG: All files:', rows);
    res.json({ 
      message: 'All files in database',
      count: rows.length,
      files: rows 
    });
  } catch (error) {
    console.error('DEBUG: Database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /files - list all files for current user
router.get('/', authMiddleware, FileController.listUserFiles);

// POST /files/upload - with multer error handling
router.post('/upload', authMiddleware, upload.single('file'), 
  FileController.uploadFile, handleMulterError);

// GET /files/:fileId/info - Get file info without downloading
router.get('/:fileId/info', authMiddleware, FileController.getFileInfo);

// GET /files/:fileId - Download file
router.get('/:fileId', authMiddleware, FileController.getFile);

// DELETE /files/:fileId
router.delete('/:fileId', authMiddleware, FileController.deleteFile);

module.exports = router;
