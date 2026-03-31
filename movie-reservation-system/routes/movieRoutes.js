const express = require('express');
const router = express.Router();
const { getAllMovies } = require('../controllers/movieController');
const { getShowtimesForMovie } = require('../controllers/showtimeController');

router.get('/', getAllMovies);
router.get('/:id/showtimes', getShowtimesForMovie);

module.exports = router;