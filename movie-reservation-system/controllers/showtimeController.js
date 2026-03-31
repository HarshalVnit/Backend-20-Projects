const pool = require('../config/db');

// @desc    Get showtimes for a specific movie
// @route   GET /api/movies/:id/showtimes
const getShowtimesForMovie = async (req, res) => {
  try {
    const movieId = req.params.id;
    const query = `
      SELECT id, start_time, price 
      FROM showtimes 
      WHERE movie_id = $1 
      ORDER BY start_time ASC;
    `;
    const result = await pool.query(query, [movieId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching showtimes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// @desc    Get specific showtime details (The JOIN query)
// @route   GET /api/showtimes/:id
const getShowtimeDetails = async (req, res) => {
  try {
    const showtimeId = req.params.id;
    const query = `
      SELECT 
        showtimes.id AS showtime_id,
        showtimes.start_time,
        showtimes.price,
        movies.title AS movie_title,
        movies.genre,
        movies.duration_minutes
      FROM showtimes
      JOIN movies ON showtimes.movie_id = movies.id
      WHERE showtimes.id = $1;
    `;
    const result = await pool.query(query, [showtimeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Showtime not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching showtime details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
//now we dont have table for seats so:
// // The Puzzle: How do we show empty seats if they don't exist?
// Remember in Phase 3 when you asked that brilliant question: "Why are we not creating a table of seats?" Because we don't have a database table full of empty seats, our backend needs to do a little bit of magic. We are going to use a technique called Data Overlay.

// We will generate the "blueprint" of our Virtual Theater purely in JavaScript (e.g., Seats A1 through D5).

// We will ask the database: "Give me all the seats for this showtime that are currently pending or confirmed."

// We will overlay the database list on top of our blueprint. If a seat isn't in the database list, we explicitly label it "available" for the frontend.

// @desc    Get seat availability for a specific showtime
// @route   GET /api/showtimes/:id/seats
const getAvailableSeats = async (req, res) => {
  try {
    const showtimeId = req.params.id;

    // 1. Generate our Virtual Theater Blueprint (Rows A-D, Seats 1-5)
    // This gives us 20 total seats: A1, A2... D4, D5.
    const rows = ['A', 'B', 'C', 'D'];
    const cols = [1, 2, 3, 4, 5];
    const allSeats = [];
    
    rows.forEach(row => {
      cols.forEach(col => {
        allSeats.push(`${row}${col}`);
      });
    });

    // 2. Ask the database which seats are currently taken or pending
    const query = `
      SELECT seat_number, status 
      FROM reservations 
      WHERE showtime_id = $1;
    `;
    const result = await pool.query(query, [showtimeId]);
    const reservedSeats = result.rows;

    // 3. The Overlay Magic
    // We map through our perfect blueprint and check it against the database
    const seatingChart = allSeats.map(seat => {
      // Try to find if this seat exists in the database results
      const foundReservation = reservedSeats.find(res => res.seat_number === seat);

      // If it exists, return its status (pending or confirmed). If not, it's available!
      return {
        seat_number: seat,
        status: foundReservation ? foundReservation.status : 'available'
      };
    });

    // 4. Send the perfectly mapped seating chart to the frontend
    res.status(200).json({
      showtime_id: showtimeId,
      total_seats: allSeats.length,
      seats: seatingChart
    });

  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
module.exports = {
  getShowtimesForMovie,
  getShowtimeDetails,
  getAvailableSeats // <-- ADD THIS
};