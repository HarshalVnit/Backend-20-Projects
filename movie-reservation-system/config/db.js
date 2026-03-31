const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle client', err);
});

// We export the pool so any controller in our app can use it to talk to the DB
module.exports = pool;