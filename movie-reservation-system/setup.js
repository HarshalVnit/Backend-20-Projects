// setup.js
const { Client } = require('pg');
require('dotenv').config();

const setupDatabase = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database. Creating tables...');

    // The raw SQL command to create our tables
    const createTablesQuery = `
      -- 1. Create Users Table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Create Movies Table
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        genre VARCHAR(50),
        duration_minutes INTEGER NOT NULL
      );

      -- 3. Create Showtimes Table
      CREATE TABLE IF NOT EXISTS showtimes (
        id SERIAL PRIMARY KEY,
        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        price DECIMAL(5, 2) NOT NULL
      );

      -- 4. Create Reservations (Tickets) Table
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        showtime_id INTEGER REFERENCES showtimes(id),
        seat_number VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'booked',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- This ensures no two people can book the exact same seat for the exact same showtime!
        UNIQUE(showtime_id, seat_number)
      );
    `;

    // Execute the SQL
    await client.query(createTablesQuery);
    console.log('✅ All tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    // Always close the phone line when done!
    await client.end(); 
  }
};

// Run the function
setupDatabase();





// In a massive system (like AMC or Regal Cinemas), you would have a theaters table and a seats table, because every physical room has a different layout (some have 50 seats, some have 200, some have VIP recliners).

// However, for the logic of a reservation system, we are using a "Virtual Theater" approach. Think about it this way: If a seat is not in the reservations table for a specific showtime_id, it means it is available.

// We don't need to store a database row that says "Seat A1 exists."

// We only need to store a row when "User 5 booked Seat A1 for Showtime 10."

// Because we added that magic line UNIQUE(showtime_id, seat_number) in our reservations table, the database acts as the ultimate bouncer. It physically will not allow two rows to exist with the same showtime and seat number. This saves us from creating thousands of useless rows of empty seats in our database!