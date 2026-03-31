const pool = require('./config/db');

const upgradeDatabase = async () => {
  try {
    console.log('🏗️ Upgrading the reservations table...');

    // The raw SQL to alter the existing table
    const alterQuery = `
      -- Add the new column (IF NOT EXISTS prevents errors if you run it twice)
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

      -- Change the default behavior of the status column
      ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'pending';
    `;

    // Execute the upgrade
    await pool.query(alterQuery);
    
    console.log('✅ Database upgraded successfully! The fortress has new walls.');

  } catch (error) {
    console.error('❌ Error upgrading database:', error);
  } finally {
    // Close the connection and exit the script
    process.exit();
  }
};

// Run the function
upgradeDatabase();