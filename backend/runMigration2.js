require('dotenv').config();
const pool = require('./config/database');

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running Email Verification and Password Reset migration...');
    
    // Add email_verified and is_active columns
    console.log('Adding email verification columns...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false');
    
    // Create email_verification_tokens table
    console.log('Creating email_verification_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create password_reset_tokens table
    console.log('Creating password_reset_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    console.log('Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)');
    
    // Verify migration
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name IN ('email_verification_tokens', 'password_reset_tokens')"
    );
    console.log('✅ Tables created:', result.rows.map(r => r.table_name).join(', '));
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
