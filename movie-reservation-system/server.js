const express = require('express');
require('dotenv').config();

// Import our DB connection just to test it on startup
const pool = require('./config/db');

// Import Routes
const movieRoutes = require('./routes/movieRoutes');
const showtimeRoutes = require('./routes/showtimeRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const app = express();

// Middleware
app.use(express.json());

// Mount Routes
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/reservations', reservationRoutes);
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
  } else {
    console.log('✅ Connected to Neon PostgreSQL Pool!');
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
// ==========================================
// 🧹 BACKGROUND SWEEPER: Expired Seat Cleanup
// ==========================================

// setInterval is a native JavaScript function that runs code repeatedly on a timer.
// Here, we set it to run every 60,000 milliseconds (exactly 1 minute).
setInterval(async () => {
  try {
    // The Cleanup Query
    const cleanupQuery = `
      DELETE FROM reservations 
      WHERE status = 'pending' AND expires_at < NOW()
      RETURNING seat_number;
    `;
    
    const result = await pool.query(cleanupQuery);
    
    // If rowCount is greater than 0, it means we actually deleted something!
    if (result.rowCount > 0) {
      console.log(`🧹 Sweeper cleared ${result.rowCount} expired seat(s):`, result.rows.map(r => r.seat_number));
    }
  } catch (error) {
    console.error('⚠️ Sweeper error:', error.message);
  }
}, 60 * 1000);
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});