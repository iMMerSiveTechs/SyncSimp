// contracts.ts
// Shared API contracts (schemas and types) used by both the server and the app.
// Import in the app as: `import { type GetSampleResponse } from "@shared/contracts"`
// Import in the server as: `import { postSampleRequestSchema } from "@shared/contracts"`

import { z } from "zod";

// GET /api/sample
export const getSampleResponseSchema = z.object({
  message: z.string(),
});
export type GetSampleResponse = z.infer<typeof getSampleResponseSchema>;

// POST /api/sample
export const postSampleRequestSchema = z.object({
  value: z.string(),
});
export type PostSampleRequest = z.infer<typeof postSampleRequestSchema>;
export const postSampleResponseSchema = z.object({
  message: z.string(),
});
export type PostSampleResponse = z.infer<typeof postSampleResponseSchema>;

// POST /api/upload/image
export const uploadImageRequestSchema = z.object({
  image: z.instanceof(File),
});
export type UploadImageRequest = z.infer<typeof uploadImageRequestSchema>;
export const uploadImageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  url: z.string(),
  filename: z.string(),
});
export type UploadImageResponse = z.infer<typeof uploadImageResponseSchema>;

// GET /api/projects
export const getProjectsResponseSchema = z.object({
  projects: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    bundleId: z.string(),
    platform: z.string(),
    syncStatus: z.string().nullable(),
    lastSyncAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
});
export type GetProjectsResponse = z.infer<typeof getProjectsResponseSchema>;

// POST /api/projects
export const createProjectRequestSchema = z.object({
  name: z.string().min(1),
  bundleId: z.string().min(1),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export const createProjectResponseSchema = z.object({
  success: z.boolean(),
  project: z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    bundleId: z.string(),
    platform: z.string(),
    syncStatus: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>;

// GET /api/projects/:id
export const getProjectResponseSchema = z.object({
  project: z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    bundleId: z.string(),
    platform: z.string(),
    syncStatus: z.string().nullable(),
    lastSyncAt: z.string().nullable(),
    lastCheckAt: z.string().nullable(),
    configYaml: z.string().nullable(),
    appleIssuerId: z.string().nullable().optional(),
    appleKeyId: z.string().nullable().optional(),
    appleP8FileContent: z.string().nullable().optional(),
    revenueCatApiKey: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});
export type GetProjectResponse = z.infer<typeof getProjectResponseSchema>;

// POST /api/validation/check/:projectId
export const validationCheckResponseSchema = z.object({
  result: z.object({
    apple: z.object({
      apiKeyValid: z.boolean(),
      appFound: z.boolean(),
      agreementsComplete: z.boolean(),
      error: z.string().optional(),
    }),
    revenuecat: z.object({
      projectOk: z.boolean(),
      iapKeyPresent: z.boolean(),
      ascKeyPresent: z.boolean(),
      error: z.string().optional(),
    }),
    local: z.object({
      configValid: z.boolean(),
      hasAllCredentials: z.boolean(),
      error: z.string().optional(),
    }),
  }),
});
export type ValidationCheckResponse = z.infer<typeof validationCheckResponseSchema>;

// POST /api/sync/run/:projectId
const syncFixSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()),
  estimatedTime: z.string(),
});

const syncStepSchema = z.object({
  name: z.string(),
  status: z.enum(['pending', 'running', 'success', 'error']),
  message: z.string(),
  logs: z.array(z.string()).optional(),
  fix: syncFixSchema.optional(),
});

export const syncRunResponseSchema = z.object({
  success: z.boolean(),
  steps: z.array(syncStepSchema),
  error: z.string().optional(),
  fix: syncFixSchema.optional(), // Top-level fix for early errors
});
export type SyncRunResponse = z.infer<typeof syncRunResponseSchema>;
export type SyncStep = z.infer<typeof syncStepSchema>;
export type SyncFix = z.infer<typeof syncFixSchema>;

// DELETE /api/projects/:id
export const deleteProjectResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteProjectResponse = z.infer<typeof deleteProjectResponseSchema>;

// POST /api/validation/check/:projectId - Request body
export const validationCheckRequestSchema = z.object({
  project: z.object({
    bundleId: z.string().min(1),
    appleIssuerId: z.string().nullable().optional(),
    appleKeyId: z.string().nullable().optional(),
    appleP8FileContent: z.string().nullable().optional(),
    revenueCatApiKey: z.string().nullable().optional(),
    revenueCatIosAppId: z.string().nullable().optional(),
  }).passthrough(), // Allow additional fields
});
export type ValidationCheckRequest = z.infer<typeof validationCheckRequestSchema>;

// POST /api/sync/run/:projectId - Request body
export const syncRunRequestSchema = z.object({
  project: z.object({
    userId: z.string().optional(),
    name: z.string().optional(),
    bundleId: z.string().min(1),
    appleIssuerId: z.string().min(1, "Apple Issuer ID is required"),
    appleKeyId: z.string().min(1, "Apple Key ID is required"),
    appleP8FileContent: z.string().min(200, "P8 file appears invalid"),
    revenueCatApiKey: z.string().min(1, "RevenueCat API Key is required"),
    revenueCatProjectId: z.string().min(1, "RevenueCat Project ID is required"),
    revenueCatIosAppId: z.string().min(1, "RevenueCat iOS App ID is required"),
    configYaml: z.string().min(1, "YAML configuration is required"),
  }).passthrough(),
});
export type SyncRunRequest = z.infer<typeof syncRunRequestSchema>;

