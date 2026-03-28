/**
 * API Client Module
 *
 * This module provides a centralized API client for making HTTP requests to the backend.
 * Authentication is handled by Firebase on the frontend - the backend just processes
 * project data sent in the request body.
 */

// Import fetch from expo/fetch for React Native compatibility
import { fetch } from "expo/fetch";

/**
 * Backend URL Configuration
 */
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000";

/**
 * Check if the backend is available
 */
export const isBackendAvailable = (): boolean => {
  return true;
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type FetchOptions = {
  method: HttpMethod;
  body?: object;
};

/**
 * Core Fetch Function
 *
 * Simple wrapper around fetch that handles JSON requests/responses.
 * No authentication handling - Firebase auth is on the frontend,
 * and protected backend routes receive data in the request body.
 */
const fetchFn = async <T>(path: string, options: FetchOptions): Promise<T> => {
  const { method, body } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const url = `${BACKEND_URL}${path}`;
  console.log(`[api.ts] Making ${method} request to: ${url}`);

  try {
    // Add timeout to prevent app from hanging on network issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("[api.ts] Response status:", response.status);

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;

      try {
        const errorData = JSON.parse(responseText);
        errorMessage += `: ${JSON.stringify(errorData)}`;
      } catch {
        errorMessage += `: ${responseText.slice(0, 200)}`;
      }

      throw new Error(`[api.ts]: ${errorMessage}`);
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (parseError) {
      console.error("[api.ts] Failed to parse response as JSON");
      throw new Error(`[api.ts]: Invalid JSON response from ${path}`);
    }
  } catch (error: any) {
    console.log(`[api.ts] Error:`, error?.message);

    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new Error(`[api.ts]: Request timeout - The server took too long to respond.`);
    }

    // Handle network errors
    if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
      throw new Error(`[api.ts]: Network error - Please check your internet connection.`);
    }

    throw error;
  }
};

/**
 * API Client Object
 */
const api = {
  get: <T>(path: string) => fetchFn<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: object) => fetchFn<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => fetchFn<T>(path, { method: "DELETE" }),
};

export { api, BACKEND_URL };
