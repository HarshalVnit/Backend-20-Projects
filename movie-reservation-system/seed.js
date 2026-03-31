// seed.js
const { Client } = require('pg');
require('dotenv').config();

const seedDatabase = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🌱 Connected. Clearing old data and planting seeds...');

    // 1. Clear existing data so we can run this script multiple times without errors
    // CASCADE means "If you delete a movie, delete its showtimes and reservations too"
    await client.query('TRUNCATE users, movies, showtimes, reservations RESTART IDENTITY CASCADE');

    // 2. Insert Users
    await client.query(`
      INSERT INTO users (name, email) 
      VALUES 
        ('Alice Explorer', 'alice@example.com'),
        ('Bob Builder', 'bob@example.com');
    `);

    // 3. Insert Movies AND get their new IDs back
    const movieQuery = `
      INSERT INTO movies (title, description, genre, duration_minutes) 
      VALUES 
        ('Inception', 'A thief enters the dreams of others to steal secrets.', 'Sci-Fi', 148),
        ('The Dark Knight', 'Batman faces off against the Joker.', 'Action', 152)
      RETURNING id, title; 
    `;
    const movieResult = await client.query(movieQuery);
    
    // Extract the IDs the database just generated for our movies
    const inceptionId = movieResult.rows[0].id;
    const batmanId = movieResult.rows[1].id;

    // 4. Insert Showtimes (Linking them to the movies using the Foreign Keys)
    // We use $1 and $2 here. This is called "Parameterized Queries" - a crucial security habit!
    const showtimeQuery = `
      INSERT INTO showtimes (movie_id, start_time, price)
      VALUES
        ($1, '2024-12-01 18:00:00', 15.00),
        ($1, '2024-12-01 21:00:00', 15.00),
        ($2, '2024-12-02 19:30:00', 12.50);
    `;
    // We pass the IDs in an array, which perfectly replaces $1 and $2 in the string above
    await client.query(showtimeQuery, [inceptionId, batmanId]);

    console.log('🌲 Seeding complete! Your virtual theater is ready.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.end();
  }
};

seedDatabase();