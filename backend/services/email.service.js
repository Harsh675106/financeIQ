require("dotenv").config();
const nodemailer = require("nodemailer");

let cachedTransports = null;

const toBool = (value) => String(value).toLowerCase() === "true";
const toNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const EMAIL_CONNECTION_TIMEOUT_MS = toNumber(
  process.env.EMAIL_CONNECTION_TIMEOUT_MS,
  8000,
);
const EMAIL_SOCKET_TIMEOUT_MS = toNumber(
  process.env.EMAIL_SOCKET_TIMEOUT_MS,
  15000,
);
const EMAIL_GREETING_TIMEOUT_MS = toNumber(
  process.env.EMAIL_GREETING_TIMEOUT_MS,
  8000,
);
const EMAIL_RETRY_ATTEMPTS = toNumber(process.env.EMAIL_RETRY_ATTEMPTS, 2);

const buildTransport = ({ host, port, secure, user, pass, name }) =>
  nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: EMAIL_CONNECTION_TIMEOUT_MS,
    greetingTimeout: EMAIL_GREETING_TIMEOUT_MS,
    socketTimeout: EMAIL_SOCKET_TIMEOUT_MS,
    tls: {
      servername: host,
    },
    name: process.env.EMAIL_HELO_NAME || "financeiq.app",
  });

const getTransports = () => {
  if (cachedTransports) return cachedTransports;

  const transports = [];
  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (hasSmtpConfig)
    transports.push(
      buildTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: toBool(process.env.SMTP_SECURE),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        name: "smtp",
      }),
    );

  // Fallback transport if SMTP_* fails or is not configured.
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transports.push(
      buildTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
        name: "gmail",
      }),
    );
  }

  if (transports.length > 0) {
    cachedTransports = transports;
    return cachedTransports;
  }

  throw new Error(
    "Email provider is not configured. Set SMTP_* vars or GMAIL_USER/GMAIL_APP_PASSWORD.",
  );
};

const getFromAddress = () =>
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  process.env.SMTP_USER ||
  process.env.GMAIL_USER;

const isRetryableError = (error) => {
  const code = error?.code || "";
  const msg = String(error?.message || "").toLowerCase();
  return (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "EAI_AGAIN" ||
    msg.includes("timeout") ||
    msg.includes("connection")
  );
};

const sendMail = async ({ to, subject, html }) => {
  const transports = getTransports();
  const fromAddress = getFromAddress();

  if (!fromAddress) {
    throw new Error("Missing sender email. Set EMAIL_FROM or SMTP_FROM.");
  }

  let lastError = null;

  for (const transporter of transports) {
    for (let attempt = 1; attempt <= EMAIL_RETRY_ATTEMPTS; attempt += 1) {
      try {
        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || "FinanceIQ"}" <${fromAddress}>`,
          to,
          subject,
          html,
        });
        return;
      } catch (error) {
        lastError = error;
        const shouldRetry = attempt < EMAIL_RETRY_ATTEMPTS && isRetryableError(error);
        if (shouldRetry) {
          await sleep(300 * attempt);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("Failed to send email.");
};

const emailService = {
  sendVerificationEmail: async (email, token, userName) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    console.log("Sending verification email to:", email);

    try {
      await sendMail({
        to: email,
        subject: "Verify your FinanceIQ email",
        html: `
          <div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;">
            <h2>Welcome ${userName}!</h2>
            <p>Click below to verify your email. Link expires in 24 hours.</p>
            <a href="${verificationLink}" 
              style="background:#3b82f6;color:white;padding:12px 24px;
              text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">
              Verify Email
            </a>
            <p style="margin-top:20px;font-size:12px;color:#666;">
              Or copy this link:<br/>
              ${verificationLink}
            </p>
          </div>
        `,
      });
      console.log("Verification email sent");
      return true;
    } catch (error) {
      console.error("Email error:", error.message || error);
      return false;
    }
  },

  sendPasswordResetEmail: async (email, token, userName) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log("Sending password reset email to:", email);

    try {
      await sendMail({
        to: email,
        subject: "Reset your FinanceIQ password",
        html: `
          <div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName}, click below to reset your password:</p>
            <a href="${resetLink}" 
              style="background:#3b82f6;color:white;padding:12px 24px;
              text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">
              Reset Password
            </a>
            <p style="margin-top:20px;font-size:12px;color:#666;">
              Or copy this link:<br/>
              ${resetLink}
            </p>
          </div>
        `,
      });
      console.log("Password reset email sent");
      return true;
    } catch (error) {
      console.error("Email error:", error.message || error);
      return false;
    }
  },
};

module.exports = emailService;
