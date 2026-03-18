import { Hono } from "hono";

// ============================================
// Development-only Routes
// ============================================
// These routes are for sandbox/development use only
// With Firebase auth, we no longer need auto-login

const devRouter = new Hono();

/**
 * GET /api/dev/status
 * Returns the current environment status
 */
devRouter.get("/status", (c) => {
  return c.json({
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    message: "Backend is running with Firebase auth on frontend",
  });
});

export default devRouter;
