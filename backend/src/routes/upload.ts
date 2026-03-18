import { Hono } from "hono";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { zValidator } from "@hono/zod-validator";
import { uploadImageRequestSchema, type UploadImageResponse } from "@/shared/contracts";

// ============================================
// Uploads directory setup
// ============================================
// Creates uploads/ directory if it doesn't exist
// All uploaded images are stored here and served via /uploads/* endpoint
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  console.log("📁 [Upload] Creating uploads directory:", UPLOADS_DIR);
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} else {
  console.log("📁 [Upload] Uploads directory exists:", UPLOADS_DIR);
}

const uploadRouter = new Hono();

// ============================================
// POST /api/upload/image - Upload an image
// ============================================
// Accepts multipart/form-data with "image" field
// Validates file type and size before saving
// Returns URL to access the uploaded image
uploadRouter.post("/image", zValidator("form", uploadImageRequestSchema), async (c) => {
  const { image } = c.req.valid("form");
  console.log("📤 [Upload] Image upload request received");

  try {
    // Check if file exists in request
    if (!image) {
      console.log("❌ [Upload] No image file provided in request");
      return c.json({ error: "No image file provided" }, 400);
    }
    console.log(
      `📄 [Upload] File received: ${image.name} (${image.type}, ${(image.size / 1024).toFixed(2)} KB)`,
    );

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      console.log(`❌ [Upload] Invalid file type: ${image.type}`);
      return c.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed" },
        400,
      );
    }
    console.log(`✅ [Upload] File type validated: ${image.type}`);

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      console.log(
        `❌ [Upload] File too large: ${(image.size / 1024 / 1024).toFixed(2)} MB (max: 10 MB)`,
      );
      return c.json({ error: "File too large. Maximum size is 10MB" }, 400);
    }
    console.log(`✅ [Upload] File size validated: ${(image.size / 1024).toFixed(2)} KB`);

    // Generate unique filename to prevent collisions
    const fileExtension = path.extname(image.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);
    console.log(`🔑 [Upload] Generated unique filename: ${uniqueFilename}`);

    // Save file to disk
    console.log(`💾 [Upload] Saving file to: ${filePath}`);
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ [Upload] File saved successfully`);

    // Return the URL to access the uploaded image
    const imageUrl = `/uploads/${uniqueFilename}`;
    console.log(`🎉 [Upload] Upload complete! Image URL: ${imageUrl}`);

    return c.json({
      success: true,
      message: "Image uploaded successfully",
      url: imageUrl,
      filename: uniqueFilename,
    } satisfies UploadImageResponse);
  } catch (error) {
    console.error("💥 [Upload] Upload error:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace available",
    );
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

export { uploadRouter };
