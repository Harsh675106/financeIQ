require('dotenv').config();
const pool = require('./config/database');

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running OAuth migration...');
    
    // Add Google OAuth fields
    console.log('Adding OAuth columns...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50)');
    
    // Create indexes
    console.log('Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified)');
    
    // Make password_hash nullable for OAuth users
    console.log('Updating password_hash constraint...');
    await client.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
    
    // Verify migration
    const result = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.log('✅ Users table columns:', result.rows.map(r => r.column_name).join(', '));
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigration().catch(() => process.exit(1));
