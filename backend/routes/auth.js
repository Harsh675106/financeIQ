const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const emailService = require("../services/email.service");

const router = express.Router();
const RESEND_COOLDOWN_SECONDS = 30;
/* ======================================================
   Helper Functions
====================================================== */

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

const getRetryAfterSeconds = (createdAt) => {
  if (!createdAt) return 0;
  const elapsedSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
};

const signJwt = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in environment variables");
  }
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || "7d",
  });
};
/* ======================================================
   REGISTER
====================================================== */

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: errors.array() });
      }
      const { email, password, name } = req.body;

      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email=$1",
        [email],
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, email_verified, is_active)
         VALUES ($1, $2, $3, false, false)
         RETURNING id, email, name`,
        [email, hashedPassword, name],
      );

      const user = result.rows[0];
      const verificationToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, verificationToken, expiresAt],
      );

      setImmediate(async () => {
        const verificationEmailSent = await emailService.sendVerificationEmail(
          email,
          verificationToken,
          name,
        );
        if (!verificationEmailSent) {
          console.error("Verification email could not be sent for user:", email);
        }
      });

      res.status(201).json({
        message: "User created successfully. Verify your email.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: false,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  },
);

/* ======================================================
   LOGIN
====================================================== */

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        `SELECT id, email, password_hash, name, email_verified
         FROM users WHERE email=$1`,
        [email],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = result.rows[0];

      if (!user.email_verified) {
        return res.status(403).json({ message: "Please verify email first" });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = signJwt(user);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.email_verified,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  },
);

/* ======================================================
   GOOGLE LOGIN
====================================================== */

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken)
      return res.status(400).json({ message: "Google ID token required" });

    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );
    const googleUser = response.data;

    let result = await pool.query(
      "SELECT id, email, name FROM users WHERE email=$1",
      [googleUser.email],
    );
    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      const insert = await pool.query(
        `INSERT INTO users (email, name, password_hash, google_id, email_verified, is_active)
         VALUES ($1, $2, $3, $4, true, true)
         RETURNING id, email, name`,
        [googleUser.email, googleUser.name, "oauth-google", googleUser.sub],
      );
      user = insert.rows[0];
    }

    const token = signJwt(user);
    res.json({
      message: "Google login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

/* ======================================================
   CURRENT USER (Me)
====================================================== */

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, email_verified FROM users WHERE id=$1",
      [req.user.id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

/* ======================================================
   VERIFY EMAIL
====================================================== */

// ... inside backend/routes/auth.js ...

/* ======================================================
   VERIFY EMAIL (Updated to POST)
====================================================== */
// ... existing code ...

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      console.error('❌ No token provided')
      return res.status(400).json({ message: 'Verification token is required' })
    }

    console.log('🔍 Looking for token:', token.substring(0, 10) + '...')

    // 1. Find the token and check expiry in one query
    const tokenResult = await pool.query(
      `SELECT user_id, expires_at
       FROM email_verification_tokens
       WHERE token = $1`,
      [token]
    )

    if (tokenResult.rows.length === 0) {
      console.error('❌ Token not found in database:', token.substring(0, 10) + '...')
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    const { user_id, expires_at } = tokenResult.rows[0]
    console.log('✅ Token found for user_id:', user_id)

    // 2. Check if expired
    if (new Date() > new Date(expires_at)) {
      console.error('❌ Token expired at:', expires_at)
      await pool.query(
        'DELETE FROM email_verification_tokens WHERE token = $1',
        [token]
      )
      return res.status(400).json({ message: 'Token has expired. Please request a new link.' })
    }

    console.log('✅ Token is valid, expiry:', expires_at)

    // 3. Update user and get data for JWT
    const userResult = await pool.query(
      `UPDATE users
       SET email_verified = true, is_active = true
       WHERE id = $1
       RETURNING id, email, name`,
      [user_id]
    )

    if (userResult.rows.length === 0) {
      console.error('❌ User not found:', user_id)
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userResult.rows[0]
    console.log('✅ User verified:', user.email)

    // 4. Clean up the token
    await pool.query('DELETE FROM email_verification_tokens WHERE token = $1', [token])

    // 5. Generate fresh JWT for instant login
    const jwtToken = signJwt(user)

    res.json({
      success: true,
      message: 'Email verified successfully!',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
      },
    })
  } catch (error) {
    console.error('❌ Verify email error:', error.message)
    res.status(500).json({ message: 'Server error during verification' })
  }
})
/* ======================================================
   RESEND EMAIL
====================================================== */

router.post(
  "/resend-verification-email",
  [body("email").isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const { email } = req.body;

      const userResult = await pool.query(
        "SELECT id, name, email_verified FROM users WHERE email=$1",
        [email],
      );

      if (!userResult.rows.length)
        return res.status(400).json({ message: "User not found" });

      const user = userResult.rows[0];

      if (user.email_verified)
        return res.status(400).json({ message: "Email already verified" });

      const latestTokenResult = await pool.query(
        `SELECT created_at
         FROM email_verification_tokens
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id],
      );

      if (latestTokenResult.rows.length > 0) {
        const retryAfter = getRetryAfterSeconds(latestTokenResult.rows[0].created_at);
        if (retryAfter > 0) {
          return res.status(429).json({
            message: `Please wait ${retryAfter}s before requesting another verification email.`,
            retryAfter,
          });
        }
      }

      await pool.query(
        "DELETE FROM email_verification_tokens WHERE user_id=$1",
        [user.id],
      );

      const verificationToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO email_verification_tokens
        (user_id, token, expires_at)
        VALUES ($1, $2, $3)`,
        [user.id, verificationToken, expiresAt],
      );

      const verificationEmailSent = await emailService.sendVerificationEmail(
        email,
        verificationToken,
        user.name,
      );

      if (!verificationEmailSent) {
        return res.status(502).json({
          message: "Could not send verification email. Please check email configuration and try again.",
        });
      }

      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      console.error("Resend email error:", error);
      res.status(500).json({ message: "Failed to resend email" });
    }
  },
);

/* ======================================================
   FORGOT PASSWORD
====================================================== */

// ... inside forgot-password route ...
// ... existing code ...

/* ======================================================
   FORGOT PASSWORD
====================================================== */
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const { email } = req.body;
      
      const userResult = await pool.query(
        'SELECT id, name FROM users WHERE email = $1',
        [email]
      );

      // Security: Always return 200 even if user doesn't exist
      if (userResult.rows.length === 0) {
        return res.json({ 
          message: 'If that email is in our system, a reset link has been sent.' 
        });
      }

      const user = userResult.rows[0];

      const latestResetTokenResult = await pool.query(
        `SELECT created_at
         FROM password_reset_tokens
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

      if (latestResetTokenResult.rows.length > 0) {
        const retryAfter = getRetryAfterSeconds(latestResetTokenResult.rows[0].created_at);
        if (retryAfter > 0) {
          return res.status(429).json({
            message: `Please wait ${retryAfter}s before requesting another reset email.`,
            retryAfter,
          });
        }
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 3600000);

      // 1. Clean up any existing reset tokens for this user
      await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

      // 2. Insert new token
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, resetToken, expiresAt]
      );

      // 3. Send email
      const resetEmailSent = await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.name,
      );

      if (!resetEmailSent) {
        return res.status(502).json({
          message: 'Unable to send reset email right now. Please try again later.',
        });
      }

      res.json({ 
        message: 'Reset link sent! Please check your inbox (and spam folder).' 
      });
    } catch (err) {
      console.error('Forgot PW Error:', err);
      res.status(500).json({ message: 'Failed to process request' });
    }
  }
);

/* ======================================================
   RESET PASSWORD
====================================================== */
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Check token and expiry (using database time to stay safe)
      const tokenResult = await pool.query(
        `SELECT user_id FROM password_reset_tokens 
         WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP`,
        [token]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({ 
          message: 'The reset link is invalid or has expired.' 
        });
      }

      const { user_id } = tokenResult.rows[0];
      const hashedPassword = await bcrypt.hash(password, 10);

      // 1. Update password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, user_id]
      );

      // 2. Delete the used token
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

      res.json({ 
        success: true, 
        message: 'Password updated! Redirecting to login...' 
      });
    } catch (err) {
      console.error('Reset PW Error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);
module.exports = router;


