const pool = require('./config/db');

const createTables = async () => {
  try {
    console.log('🏗️  Constructing the SQL Vault...');

    const query = `
      -- 1. Create Restaurants Table
      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cuisine VARCHAR(100),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Create Reviews Table
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        review_text TEXT NOT NULL,
        nlp_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(query);
    console.log('✅ Tables created successfully! The Vault is secure.');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    process.exit();
  }
};

createTables();