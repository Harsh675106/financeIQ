const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const logPayload = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    userId: req.user?.id || null,
  };

  console.error("Request error:", logPayload);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
