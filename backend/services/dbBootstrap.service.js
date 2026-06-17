const pool = require("../config/database");

async function bootstrapDatabase() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      symbol VARCHAR(50),
      quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
      price DECIMAL(20,8) NOT NULL DEFAULT 0,
      purchase_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS liabilities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      rate DECIMAL(7,4),
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      retirement_age INTEGER,
      dependents INTEGER,
      income_stability VARCHAR(20),
      risk_quiz_score INTEGER,
      target_allocation JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(100) NOT NULL,
      amount_monthly DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category)
    );

    CREATE TABLE IF NOT EXISTS copilot_messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_feedback (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      corrected_category VARCHAR(100) NOT NULL,
      suggested_category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_analyses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_name VARCHAR(255) NOT NULL,
      document_type VARCHAR(50) NOT NULL,
      source_type VARCHAR(30) NOT NULL DEFAULT 'text',
      raw_content TEXT,
      extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      import_status VARCHAR(20) NOT NULL DEFAULT 'analyzed',
      imported_records_count INTEGER NOT NULL DEFAULT 0,
      imported_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
    CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
    CREATE INDEX IF NOT EXISTS idx_copilot_messages_user_id ON copilot_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_transaction_feedback_user_id ON transaction_feedback(user_id);
    CREATE INDEX IF NOT EXISTS idx_document_analyses_user_id ON document_analyses(user_id);
  `);
}

module.exports = { bootstrapDatabase };
