const express = require('express');
const router = express.Router();
const { submitReview, getLeaderboard } = require('../controllers/reviewController'); // <-- Import the new function

router.post('/', submitReview);

// NEW: Route to get the leaderboard
router.get('/leaderboard', getLeaderboard);

module.exports = router;