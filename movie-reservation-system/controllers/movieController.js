const pool = require('../config/db');

// @desc    Get all movies
// @route   GET /api/movies
const getAllMovies = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies;');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllMovies,
};