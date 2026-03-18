import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";

import { env } from "./env";
import { rateLimiter } from "./middleware/rateLimiter";
import { uploadRouter } from "./routes/upload";
import { sampleRouter } from "./routes/sample";
import validationRouter from "./routes/validation";
import syncRouter from "./routes/sync";
import devRouter from "./routes/dev";

// Simple Hono app - no auth middleware needed
// Firebase handles authentication on the frontend
// All protected routes receive project data in the request body
const app = new Hono();

console.log("🔧 Initializing Hono application...");
app.use("*", logger());
app.use("/*", cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    process.env.BACKEND_URL || "http://localhost:3000",
    "http://localhost:8081",
  ],
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}));

// Security headers middleware
app.use("*", async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  await next();
});

// Serve uploaded images statically
// Files in uploads/ directory are accessible at /uploads/* URLs
console.log("📁 Serving static files from uploads/ directory");
app.use("/uploads/*", serveStatic({ root: "./" }));

// Global error handler
app.onError((err, c) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log safely - never log full error objects in production
  if (isProduction) {
    console.error('[Error]', err.name, '-', err.message);
  } else {
    console.error('[Error]', err.name, '-', err.message);
    console.error('[Error Stack]', err.stack);
  }

  // Check if it's a validation error from zod
  if (err.name === 'ZodError' || err.message.includes('ZodError')) {
    return c.json({ error: 'Validation error', details: isProduction ? 'Invalid input' : err.message }, 400);
  }

  return c.json({ error: isProduction ? 'Internal server error' : err.message }, 500);
});

// Rate limiting for sensitive endpoints
app.use("/api/validation/*", rateLimiter({ windowMs: 60_000, maxRequests: 10, message: "Too many validation requests. Please wait a minute." }));
app.use("/api/sync/*", rateLimiter({ windowMs: 60_000, maxRequests: 5, message: "Too many sync requests. Please wait a minute." }));
app.use("/api/upload/*", rateLimiter({ windowMs: 60_000, maxRequests: 20, message: "Too many upload requests. Please wait a minute." }));

// Mount route modules
console.log("Mounting upload routes at /api/upload");
app.route("/api/upload", uploadRouter);

console.log("Mounting sample routes at /api/sample");
app.route("/api/sample", sampleRouter);

console.log("Mounting validation routes at /api/validation");
app.route("/api/validation", validationRouter);

console.log("Mounting sync routes at /api/sync");
app.route("/api/sync", syncRouter);

console.log("🛠️  Mounting dev routes at /api/dev");
app.route("/api/dev", devRouter);

// Health check endpoint
// Used by load balancers and monitoring tools to verify service is running
app.get("/health", (c) => {
  console.log("💚 Health check requested");
  return c.json({ status: "ok" });
});

// Start the server
console.log("⚙️  Starting server...");
serve({ fetch: app.fetch, port: Number(env.PORT) }, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🚀 Server is running on port ${env.PORT}`);
  console.log(`🔗 Base URL: http://localhost:${env.PORT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📚 Available endpoints:");
  console.log("  📤 Upload:     POST /api/upload/image");
  console.log("  📝 Sample:     GET/POST /api/sample");
  console.log("  ✅ Validation: POST /api/validation/check/:projectId");
  console.log("  🔄 Sync:       POST /api/sync/run/:projectId");
  console.log("  💚 Health:     GET /health");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
