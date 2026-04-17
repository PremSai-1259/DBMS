const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/rolemiddleware');

// POST /reviews
router.post('/', authMiddleware, roleMiddleware(['patient']), 
  ReviewController.createReview);

// GET /reviews/:doctorId
router.get('/:doctorId', ReviewController.getDoctorReviews);

// PUT /reviews/:id
router.put('/:reviewId', authMiddleware, roleMiddleware(['patient']), 
  ReviewController.updateReview);

module.exports = router;
