import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetSampleResponse,
  postSampleRequestSchema,
  type PostSampleResponse,
} from "@/shared/contracts";

// Sample routes demonstrating common patterns
// These serve as examples for building your own API endpoints
const sampleRouter = new Hono();

// ============================================
// GET /api/sample - Public endpoint
// ============================================
// Example of a simple public endpoint that anyone can access
sampleRouter.get("/", (c) => {
  console.log("📝 [Sample] Public GET request received");
  return c.json({ message: "Hello, world!" } satisfies GetSampleResponse);
});

// ============================================
// POST /api/sample - Sample POST with validation
// ============================================
// Example of a POST endpoint with Zod validation
// Request body must match postSampleRequestSchema
// Try sending: { "value": "ping" } to get "pong" response
sampleRouter.post("/", zValidator("json", postSampleRequestSchema), async (c) => {
  const { value } = c.req.valid("json"); // Fully type-safe input value
  console.log(`📝 [Sample] POST request received with value: "${value}"`);

  if (value === "ping") {
    console.log("🏓 [Sample] Ping-pong response triggered");
    return c.json({ message: "pong" });
  }

  console.log("📤 [Sample] Returning default response");
  return c.json({ message: "Hello, world!" } satisfies PostSampleResponse);
});

export { sampleRouter };
