/**
 * API Client Module
 *
 * Uses Firebase Cloud Functions (httpsCallable) for all backend operations.
 * Authentication is handled automatically by Firebase -- the Cloud Function
 * receives the authenticated user's UID via context.auth.
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

import type { SyncRunResponse } from "@/shared/contracts";
import type { ValidationCheckResponse } from "@/shared/contracts";

// Callable function references
const runSyncFn = httpsCallable(functions, "runSync");
const checkValidationFn = httpsCallable(functions, "checkValidation");

/**
 * Run sync for a project.
 * The Cloud Function reads project data directly from Firestore.
 */
export async function runSync(projectId: string): Promise<SyncRunResponse> {
  try {
    const result = await runSyncFn({ projectId });
    return result.data as SyncRunResponse;
  } catch (error: any) {
    console.log("[api] runSync error:", error.message);

    // Firebase callable errors include a details field with our custom JSON
    if (error.details) {
      try {
        return typeof error.details === "string" ? JSON.parse(error.details) : error.details;
      } catch {
        // fall through
      }
    }

    // Try to parse the error message as JSON (we encode fix instructions there)
    if (error.message) {
      try {
        return JSON.parse(error.message);
      } catch {
        // fall through
      }
    }

    throw error;
  }
}

/**
 * Run validation for a project.
 * The Cloud Function reads project data directly from Firestore.
 */
export async function checkValidation(projectId: string): Promise<ValidationCheckResponse> {
  try {
    const result = await checkValidationFn({ projectId });
    return result.data as ValidationCheckResponse;
  } catch (error: any) {
    console.log("[api] checkValidation error:", error.message);
    throw error;
  }
}

/**
 * Legacy API client object for backward compatibility.
 * Screens that still use api.post() will work through this wrapper.
 */
export const api = {
  post: async <T>(path: string, body?: any): Promise<T> => {
    // Route to the correct callable function based on path
    if (path.includes("/api/sync/run/")) {
      const projectId = path.split("/api/sync/run/")[1];
      return runSync(projectId) as unknown as T;
    }
    if (path.includes("/api/validation/check/")) {
      const projectId = path.split("/api/validation/check/")[1];
      return checkValidation(projectId) as unknown as T;
    }
    throw new Error(`[api] Unknown endpoint: ${path}. All backend calls should use Cloud Functions.`);
  },
  get: async <T>(_path: string): Promise<T> => {
    throw new Error("[api] GET not supported. Use Firebase directly.");
  },
};

export const BACKEND_URL = ""; // No longer needed -- using Firebase Cloud Functions
