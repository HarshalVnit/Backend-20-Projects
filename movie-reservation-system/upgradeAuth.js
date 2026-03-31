const pool = require('./config/db');

const upgradeUsersTable = async () => {
  try {
    console.log('🏗️ Upgrading users table for Authentication...');
    
    const alterQuery = `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `;
    
    await pool.query(alterQuery);
    console.log('✅ Users table upgraded with email and password!');
    
  } catch (error) {
    console.error('❌ Error upgrading database:', error);
  } finally {
    process.exit();
  }
};

upgradeUsersTable();