// A simple in-memory sliding-window rate limiter. Good enough for a
// single-server deployment (one VPS/container running `next start`).
//
// NOTE: if you later deploy across multiple server instances (e.g.
// serverless with several concurrent regions), this in-memory counter
// won't be shared between them, so it becomes a soft per-instance limit
// rather than a hard global one. For a single VPS running your city event,
// this is fine. If you outgrow one server, swap this for Upstash Redis's
// rate-limit package - same interface, shared across instances.

const buckets = new Map();

export function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: maxRequests - bucket.count };
}

// Periodically clear out old entries so this doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();
