import { useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Auto-login hook for sandbox environment only
 * CRITICAL: Auto-login is DISABLED by default to prevent production issues
 * Only runs if __DEV__ is true (development mode)
 */
export function useAutoLogin() {
  const hasAttempted = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function attemptAutoLogin() {
      // Only run once
      if (hasAttempted.current) return;
      hasAttempted.current = true;

      // CRITICAL: ONLY run auto-login in development mode (__DEV__ === true)
      // __DEV__ is false in production builds, true in development/simulator
      // This is the ONLY reliable way to detect production vs development
      if (!__DEV__) {
        console.log("[AutoLogin] Production build detected (__DEV__ is false) - auto-login DISABLED");
        setIsLoading(false);
        return;
      }

      // Additional safety check: backend URL must exist
      const backendUrl = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL;
      if (!backendUrl) {
        console.log("[AutoLogin] No backend URL found - auto-login DISABLED");
        setIsLoading(false);
        return;
      }

      console.log("[AutoLogin] Vibecode sandbox detected - enabling auto-login");
      setIsLoading(true);

      // CRITICAL: Set a maximum timeout for auto-login
      // This prevents the app from hanging indefinitely if backend is unreachable
      const timeoutId = setTimeout(() => {
        console.log("[AutoLogin] Timeout - proceeding without auto-login");
        setIsLoading(false);
      }, 5000); // 5 second timeout

      try {
        console.log("[AutoLogin] Starting auto-login...");

        // Add small delay on iOS to ensure user interaction is allowed
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const projectId = process.env.EXPO_PUBLIC_VIBECODE_PROJECT_ID;
        const cookieKey = `${projectId}.better-auth.session_token`;

        // Clear any existing invalid session first
        try {
          await SecureStore.deleteItemAsync(cookieKey);
          console.log("[AutoLogin] Cleared old session");
        } catch (deleteError) {
          // Ignore errors when deleting (item might not exist)
          console.log("[AutoLogin] No old session to clear");
        }

        // Call the backend dev endpoint to get admin credentials
        const backendUrl = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL;

        // Create abort controller for timeout
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(`${backendUrl}/api/dev/auto-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(fetchTimeout);

        if (!response.ok) {
          console.log("[AutoLogin] Failed:", response.status);
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log("[AutoLogin] Received session for:", data.user.email);

        // Store the session token in SecureStore (same way Better Auth does)
        try {
          await SecureStore.setItemAsync(cookieKey, data.session.token);
          console.log("[AutoLogin] Session stored successfully");
          console.log("[AutoLogin] Auto-login complete!");
        } catch (storeError: any) {
          console.log("[AutoLogin] Failed to store session:", storeError.message);
          // If SecureStore fails, the user will need to login manually
          // This is acceptable - auto-login is a convenience feature
        }

        clearTimeout(timeoutId);
        setIsLoading(false);
      } catch (error: any) {
        console.log("[AutoLogin] Error:", error.message || error);
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    }

    attemptAutoLogin();
  }, []);

  return { isLoading };
}
