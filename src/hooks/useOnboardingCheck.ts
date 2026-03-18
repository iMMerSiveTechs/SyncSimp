import { useEffect, useRef } from "react";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { useSession } from "@/lib/useSession";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Hook to check if the user needs to complete onboarding
 * Automatically navigates to onboarding flow if user is logged in but hasn't completed onboarding
 *
 * IMPORTANT: Only call this once at app level (App.tsx), not on individual screens
 */
export function useOnboardingCheck() {
  const navigation = useNavigation<NavigationProp>();
  const { data: session, isPending } = useSession();
  const hasNavigated = useRef(false);

  // Get current route name safely without useRoute
  const currentRouteName = useNavigationState(state => {
    if (!state || !state.routes || state.routes.length === 0) return null;
    const currentRoute = state.routes[state.index];
    return currentRoute?.name;
  });

  // Check if navigation is ready
  const isNavigationReady = useNavigationState(state => state !== undefined);

  useEffect(() => {
    console.log("[useOnboardingCheck] Running check...", {
      isPending,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasCompletedOnboarding: (session?.user as any)?.hasCompletedOnboarding,
      currentRouteName,
      hasNavigated: hasNavigated.current,
      isNavigationReady
    });

    // Don't check if navigation isn't ready
    if (!isNavigationReady) {
      console.log("[useOnboardingCheck] Navigation not ready, skipping");
      return;
    }

    // Don't check if still loading session
    if (isPending) {
      console.log("[useOnboardingCheck] Session still loading, skipping");
      return;
    }

    // Don't check if already navigated to onboarding
    if (hasNavigated.current) {
      console.log("[useOnboardingCheck] Already navigated, skipping");
      return;
    }

    const user = session?.user;

    // Don't redirect if already on an onboarding screen
    const onboardingScreens = ['OnboardingWelcome', 'OnboardingFeatures', 'OnboardingUpgrade'];
    if (currentRouteName && onboardingScreens.includes(currentRouteName)) {
      console.log("[useOnboardingCheck] Already on onboarding screen, skipping");
      return;
    }

    // Check if user is logged in and hasn't completed onboarding
    if (user && !(user as any).hasCompletedOnboarding) {
      console.log("[useOnboardingCheck] User needs to complete onboarding, navigating to welcome screen");
      hasNavigated.current = true;

      // Use setTimeout to avoid navigation during render
      setTimeout(() => {
        try {
          navigation.navigate("OnboardingWelcome");
        } catch (error) {
          console.log("[useOnboardingCheck] Navigation failed:", error);
          // Reset flag so we can try again
          hasNavigated.current = false;
        }
      }, 100);
    } else {
      console.log("[useOnboardingCheck] No navigation needed", {
        hasUser: !!user,
        hasCompletedOnboarding: (user as any)?.hasCompletedOnboarding
      });
    }
  }, [session, isPending, navigation, currentRouteName, isNavigationReady]);

  return { isPending, needsOnboarding: session?.user && !(session.user as any).hasCompletedOnboarding };
}
