import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

/**
 * Backend URL for authentication
 * HARDCODED for production - the Vibecode sandbox URL is publicly accessible
 */
const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || "http://localhost:3000";

/**
 * Check if auth backend is available
 * Always returns true since backend URL is hardcoded
 */
export const isAuthAvailable = (): boolean => {
  return true;
};

export const authClient = createAuthClient({
  baseURL: BACKEND_URL,
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme: "vibecode",
      storagePrefix: process.env.EXPO_PUBLIC_VIBECODE_PROJECT_ID || "syncsimp",
      storage: SecureStore,
    }),
  ],
  fetchOptions: {
    onRequest: async (context) => {
      // Intercept every request and add the token as a query parameter
      // This fixes the issue where the proxy strips headers
      try {
        const projectId = process.env.EXPO_PUBLIC_VIBECODE_PROJECT_ID || "syncsimp";
        const cookieKey = `${projectId}.better-auth.session_token`;
        const token = await SecureStore.getItemAsync(cookieKey);

        if (token) {
          // Add token to query params
          const url = new URL(context.url);
          url.searchParams.set("_token", token);
          context.url = url.toString();
          console.log("[authClient] Added token to request");
        }
      } catch (error) {
        console.log("[authClient] Error adding token:", error);
      }
    },
  },
});
