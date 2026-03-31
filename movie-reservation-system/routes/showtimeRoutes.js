const express = require('express');
const router = express.Router();
const { getShowtimeDetails, getAvailableSeats } = require('../controllers/showtimeController');

router.get('/:id', getShowtimeDetails);

// NEW ROUTE: Get all seats for a specific showtime
router.get('/:id/seats', getAvailableSeats);

module.exports = router;