const buckets = new Map();

function cleanupExpiredEntries(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function createRateLimiter({
  windowMs = 60_000,
  maxRequests = 10,
  keyGenerator = (req) => req.ip || "unknown",
  message = "Too many requests. Please try again shortly.",
} = {}) {
  return (req, res, next) => {
    const now = Date.now();
    cleanupExpiredEntries(now);

    const key = keyGenerator(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        message,
        retryAfter: retryAfterSeconds,
      });
    }

    bucket.count += 1;
    return next();
  };
}

module.exports = { createRateLimiter };
