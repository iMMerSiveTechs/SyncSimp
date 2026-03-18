import type { Context, Next } from "hono";

/**
 * Simple in-memory rate limiter middleware for Hono.
 * Tracks requests per IP within a sliding window.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

type RateLimitOptions = {
  windowMs: number;   // Time window in ms
  maxRequests: number; // Max requests per window
  message?: string;    // Custom error message
};

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = "Too many requests, please try again later" } = options;

  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
      || c.req.header("x-real-ip")
      || "unknown";

    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      // New window
      store.set(key, { count: 1, resetAt: now + windowMs });
      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", String(maxRequests - 1));
      await next();
      return;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", "0");
      return c.json({ error: message }, 429);
    }

    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(maxRequests - entry.count));
    await next();
  };
}
