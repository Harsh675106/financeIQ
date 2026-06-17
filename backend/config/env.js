function parseBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
}

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY || "";
  const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  process.env.GROQ_API_KEY = apiKey;
  process.env.GROQ_BASE_URL = baseUrl;
  process.env.GROQ_MODEL = model;

  return {
    apiKey,
    baseUrl,
    model,
  };
}

function validateEnv() {
  const required = ["JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (!process.env.DATABASE_URL) {
    const localDbFields = ["DB_HOST", "DB_NAME", "DB_USER"];
    const missingLocalDb = localDbFields.filter(
      (key) => !process.env[key] || String(process.env[key]).trim().length === 0,
    );

    if (missingLocalDb.length > 0) {
      throw new Error(
        `DATABASE_URL is not set and local DB variables are incomplete: ${missingLocalDb.join(", ")}`,
      );
    }
  }

  const groq = getGroqConfig();

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number.parseInt(process.env.PORT || "5000", 10),
    smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
    hasGroq: Boolean(groq.apiKey),
    groqProvider: "groq",
  };
}

module.exports = { validateEnv };
