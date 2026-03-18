import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/lib/queryClient";
import RootStackNavigator from "@/navigation/RootNavigator";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClientProvider } from "@tanstack/react-query";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { useSession } from "@/lib/useSession";
import { useEffect, Component, type ReactNode } from "react";
import { setUserId, isRevenueCatEnabled } from "@/lib/revenuecatClient";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

// Error Boundary to catch crashes and show friendly error screen
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', padding: 20 }}>
          <Text style={{ color: '#ef4444', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable
            onPress={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{ backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  // Get session from Firebase
  const { data: session, isPending: isSessionPending } = useSession();

  // Set RevenueCat user ID when session is available
  useEffect(() => {
    const configureRevenueCat = async () => {
      if (session?.user?.id && isRevenueCatEnabled()) {
        console.log("[AppContent] Setting RevenueCat user ID:", session.user.id);
        const result = await setUserId(session.user.id);
        if (result.ok) {
          console.log("[AppContent] RevenueCat user ID set successfully");
        } else {
          console.log("[AppContent] Failed to set RevenueCat user ID:", result.reason);
        }
      }
    };

    configureRevenueCat();
  }, [session?.user?.id]);

  // Show loading screen while checking auth state
  if (isSessionPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <RootStackNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  // Cache breaker: 2025-12-15-firebase-migration-v6
  console.log("[App] Firebase Migration V6: Using Firebase for auth and data");
  console.log("[App] __DEV__ is:", __DEV__);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <NavigationContainer>
                <AppContent />
              </NavigationContainer>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </KeyboardProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
