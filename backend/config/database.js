const { Pool } = require("pg");

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: parseNumber(process.env.DB_POOL_MAX, 10),
    idleTimeoutMillis: parseNumber(process.env.DB_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: parseNumber(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
    keepAlive: true,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseNumber(process.env.DB_PORT, 5432),
    database: process.env.DB_NAME || "finance_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    max: parseNumber(process.env.DB_POOL_MAX, 20),
    idleTimeoutMillis: parseNumber(process.env.DB_IDLE_TIMEOUT_MS, 30000),
    connectionTimeoutMillis: parseNumber(process.env.DB_CONNECT_TIMEOUT_MS, 5000),
  };
}

const pool = new Pool(poolConfig);

pool
  .query("SELECT NOW()")
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err.message));

pool.on("error", (err) => {
  console.error("Unexpected database idle client error:", err.message);
});

module.exports = pool;
