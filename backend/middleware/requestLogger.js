function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const userId = req.user?.id || "anonymous";
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms user=${userId}`,
    );
  });

  next();
}

module.exports = { requestLogger };
