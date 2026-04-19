const express = require('express');
const router = express.Router();
const { FileController, upload } = require('../controllers/fileController');
const authMiddleware = require('../middleware/authmiddleware');
const db = require('../configs/db');

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err && (err.name === 'MulterError' || err.message)) {
    console.error('Multer error:', err.message);
    return res.status(400).json({ error: `Upload failed: ${err.message}` });
  }
  next(err);
};

// GET /files - list all files for current user
router.get('/', authMiddleware, FileController.listUserFiles);

// POST /files/upload - with multer middleware
router.post('/upload', authMiddleware, upload.single('file'), handleMulterError,
  FileController.uploadFile);

// GET /files/:fileId/info - Get file info without downloading
router.get('/:fileId/info', authMiddleware, FileController.getFileInfo);

// GET /files/:fileId/preview - Inline preview with auth via header or query token
router.get('/:fileId/preview', FileController.previewFile);

// GET /files/:fileId - Download file
router.get('/:fileId', authMiddleware, FileController.getFile);

// DELETE /files/:fileId
router.delete('/:fileId', authMiddleware, FileController.deleteFile);

module.exports = router;
