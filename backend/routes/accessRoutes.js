const express = require('express');
const router = express.Router();
const AccessController = require('../controllers/accessController');
const authMiddleware = require('../middleware/authmiddleware');

// POST /access/request
router.post('/request', authMiddleware, AccessController.requestAccess);

// GET /access/requests
router.get('/requests', authMiddleware, AccessController.getAccessRequests);

// PUT /access/respond/:id
router.put('/respond/:requestId', authMiddleware, AccessController.respondToRequest);

// PUT /access/revoke/:id
router.put('/revoke/:requestId', authMiddleware, AccessController.revokeAccess);

module.exports = router;
