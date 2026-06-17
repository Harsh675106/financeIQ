require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const financeRoutes = require("./routes/finance");
const { errorHandler } = require("./middleware/errorHandler");
const { requestLogger } = require("./middleware/requestLogger");
const { bootstrapDatabase } = require("./services/dbBootstrap.service");
const { validateEnv } = require("./config/env");

const env = validateEnv();
const app = express();
const PORT = env.port || 5000;

const parseAllowedOrigins = () => {
  const localDefaults = ["http://localhost:3000", "http://127.0.0.1:3000"];
  const rawOrigins = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (rawOrigins.length > 0) {
    return [...new Set(rawOrigins)];
  }

  return process.env.NODE_ENV === "production" ? [] : localDefaults;
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`),
      );
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(requestLogger);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date(),
    env: env.nodeEnv,
    groqConfigured: env.hasGroq,
    groqProvider: env.groqProvider,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/savings", require("./routes/savings"));
app.use("/api/debts", require("./routes/debts"));
app.use("/api/portfolio", require("./routes/portfolio"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/budget", require("./routes/budget"));
app.use("/api/wealth", require("./routes/wealth"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/markets", require("./routes/markets"));

app.use(errorHandler);

async function startServer() {
  try {
    await bootstrapDatabase();
    console.log("Database bootstrap completed");
    console.log(`Groq provider: ${env.groqProvider}`);
    console.log(`Groq configured: ${env.hasGroq ? "yes" : "no"}`);

    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
