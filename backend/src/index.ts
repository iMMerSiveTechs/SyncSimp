import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";

import { env } from "./env";
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
  origin: "*",
  credentials: true,
  allowHeaders: ["Content-Type"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}));

// Serve uploaded images statically
// Files in uploads/ directory are accessible at /uploads/* URLs
console.log("📁 Serving static files from uploads/ directory");
app.use("/uploads/*", serveStatic({ root: "./" }));

// Global error handler for validation errors
app.onError((err, c) => {
  console.error('[Global Error Handler] ============================================');
  console.error('[Global Error Handler] Error caught:', err);
  console.error('[Global Error Handler] Error name:', err.name);
  console.error('[Global Error Handler] Error message:', err.message);
  console.error('[Global Error Handler] Error stack:', err.stack);
  console.error('[Global Error Handler] ============================================');

  // Check if it's a validation error from zod
  if (err.name === 'ZodError' || err.message.includes('ZodError')) {
    return c.json({ error: 'Validation error', details: err.message }, 400);
  }

  return c.json({ error: 'Internal server error', details: err.message }, 500);
});

// Mount route modules
console.log("📤 Mounting upload routes at /api/upload");
app.route("/api/upload", uploadRouter);

console.log("📝 Mounting sample routes at /api/sample");
app.route("/api/sample", sampleRouter);

console.log("✅ Mounting validation routes at /api/validation");
app.route("/api/validation", validationRouter);

console.log("🔄 Mounting sync routes at /api/sync");
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
