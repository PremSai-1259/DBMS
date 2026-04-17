const express = require('express');
const router = express.Router();
const { FileController, upload } = require('../controllers/fileController');
const authMiddleware = require('../middleware/authmiddleware');

// POST /files/upload
router.post('/upload', authMiddleware, upload.single('file'), 
  FileController.uploadFile);

// GET /files/:id
router.get('/:fileId', authMiddleware, FileController.getFile);

// DELETE /files/:id
router.delete('/:fileId', authMiddleware, FileController.deleteFile);

module.exports = router;
