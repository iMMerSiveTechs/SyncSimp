import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { CheckCircle, Loader, AlertCircle, Image as ImageIcon, Film, Crown, Wrench } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { getProject, updateProject, type Project } from "@/lib/firebase";
import { serverTimestamp } from "firebase/firestore";
import { useSession } from "@/lib/useSession";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SyncRunResponse, SyncStep, SyncFix } from "@/shared/contracts";
import { HelpModal } from "@/components/HelpModal";
import { getErrorFixForValidationResult, type ErrorFix } from "@/constants/errorFixes";
import { hasEntitlement, isRevenueCatEnabled } from "@/lib/revenuecatClient";
import { NativePaywall } from "@/components/NativePaywall";

type Props = RootStackScreenProps<"Sync">;

const LOG_PREFIX = "[SyncScreen]";

// Helper to parse error and extract clean message + error code
function parseErrorMessage(rawError: string): { displayMessage: string; errorCode: string | null; failedStep: string | null; appleDetail: string | null } {
  // Try to parse as JSON response
  try {
    // Check if it contains JSON
    const jsonMatch = rawError.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Extract the error code
      const errorCode = parsed.error || null;

      // Find which step failed
      let failedStep: string | null = null;
      let failedMessage: string | null = null;

      if (parsed.steps && Array.isArray(parsed.steps)) {
        const failedStepObj = parsed.steps.find((s: any) => s.status === "error");
        if (failedStepObj) {
          failedStep = failedStepObj.name;
          failedMessage = failedStepObj.message;
        }
      }

      // Check for new detailed Apple error format: APPLE_ACCOUNT_SETUP_REQUIRED:item:title:detail
      let appleDetail: string | null = null;
      if (errorCode && errorCode.includes('APPLE_ACCOUNT_SETUP_REQUIRED:')) {
        const parts = errorCode.split(':');
        const missingItem = parts[1] || 'unknown';
        const title = parts[2] || 'Setup required';
        const detail = parts.slice(3).join(':') || '';
        appleDetail = detail;

        return {
          displayMessage: `Apple blocked: Missing "${missingItem}"`,
          errorCode: "APPLE_ACCOUNT_SETUP_REQUIRED",
          failedStep: "Apple App Store Connect",
          appleDetail: detail || `Apple is blocking in-app purchase creation. The "${missingItem}" relationship is not configured.`
        };
      }

      // Check for APPLE_403_ERROR format
      if (errorCode && errorCode.includes('APPLE_403_ERROR:')) {
        const parts = errorCode.split(':');
        const code = parts[1] || 'FORBIDDEN';
        const title = parts[2] || 'Forbidden';
        const detail = parts.slice(3).join(':') || '';

        return {
          displayMessage: `Apple error: ${title}`,
          errorCode: code,
          failedStep: "Apple App Store Connect",
          appleDetail: detail
        };
      }

      // Create a clean display message
      let displayMessage = "";
      if (failedStep) {
        displayMessage = `${failedStep} failed`;
        if (failedMessage && failedMessage !== errorCode) {
          displayMessage += `: ${failedMessage}`;
        }
      } else if (errorCode) {
        // Convert error code to readable format
        displayMessage = errorCode.replace(/_/g, " ").toLowerCase();
        displayMessage = displayMessage.charAt(0).toUpperCase() + displayMessage.slice(1);
      } else {
        displayMessage = "Sync failed";
      }

      return { displayMessage, errorCode, failedStep, appleDetail: null };
    }
  } catch {
    // Not JSON, use as-is
  }

  // Check for new detailed Apple error format in raw string
  if (rawError.includes("APPLE_ACCOUNT_SETUP_REQUIRED:")) {
    const match = rawError.match(/APPLE_ACCOUNT_SETUP_REQUIRED:([^:]*):([^:]*):(.*)$/);
    if (match) {
      const missingItem = match[1] || 'unknown';
      const title = match[2] || 'Setup required';
      const detail = match[3] || '';
      return {
        displayMessage: `Apple blocked: Missing "${missingItem}"`,
        errorCode: "APPLE_ACCOUNT_SETUP_REQUIRED",
        failedStep: "Apple App Store Connect",
        appleDetail: detail || `Apple is blocking in-app purchase creation. The "${missingItem}" relationship is not configured.`
      };
    }
    return {
      displayMessage: "Apple account setup required",
      errorCode: "APPLE_ACCOUNT_SETUP_REQUIRED",
      failedStep: "Apple App Store Connect",
      appleDetail: null
    };
  }

  // Check for APPLE_403_ERROR in raw string
  if (rawError.includes("APPLE_403_ERROR:")) {
    const match = rawError.match(/APPLE_403_ERROR:([^:]*):([^:]*):(.*)$/);
    if (match) {
      const code = match[1] || 'FORBIDDEN';
      const title = match[2] || 'Forbidden';
      const detail = match[3] || '';
      return {
        displayMessage: `Apple error: ${title}`,
        errorCode: code,
        failedStep: "Apple App Store Connect",
        appleDetail: detail
      };
    }
  }

  // Clean up common prefixes
  let cleaned = rawError;
  if (cleaned.startsWith("[api.ts]:")) {
    cleaned = cleaned.replace("[api.ts]:", "").trim();
  }
  if (cleaned.includes("500 internal server error:")) {
    cleaned = cleaned.replace("500 internal server error:", "").trim();
  }

  return { displayMessage: cleaned, errorCode: null, failedStep: null, appleDetail: null };
}

const SyncScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const [isSyncing, setIsSyncing] = useState(false);
  const [steps, setSteps] = useState<SyncStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [parsedError, setParsedError] = useState<{ displayMessage: string; errorCode: string | null; failedStep: string | null; appleDetail: string | null } | null>(null);
  const [errorFix, setErrorFix] = useState<ErrorFix | null>(null);
  const [backendFix, setBackendFix] = useState<SyncFix | null>(null);
  const [showErrorHelp, setShowErrorHelp] = useState(false);
  const [syncSucceeded, setSyncSucceeded] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkingEntitlement, setCheckingEntitlement] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);

  // Fetch project from Firebase
  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId, userId],
    queryFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const project = await getProject(projectId, userId);
      return project;
    },
    enabled: !!userId,
  });

  // Load saved error from project if exists
  useEffect(() => {
    if (projectData?.syncStatus === "error" && projectData?.lastSyncError && !error) {
      console.log(`${LOG_PREFIX} Loading saved error from project`);
      setError(projectData.lastSyncError);
    }
  }, [projectData?.syncStatus, projectData?.lastSyncError]);

  // Check if user has premium entitlement on mount
  useEffect(() => {
    const checkEntitlement = async () => {
      console.log(`${LOG_PREFIX} Checking premium entitlement...`);
      setCheckingEntitlement(true);

      if (!isRevenueCatEnabled()) {
        console.log(`${LOG_PREFIX} RevenueCat not enabled, allowing sync`);
        setHasPremium(true);
        setCheckingEntitlement(false);
        return;
      }

      const result = await hasEntitlement("premium");

      if (result.ok) {
        console.log(`${LOG_PREFIX} Has premium: ${result.data}`);
        setHasPremium(result.data);
      } else {
        console.log(`${LOG_PREFIX} Failed to check entitlement:`, result.reason);
        // If check fails, allow sync (benefit of the doubt)
        setHasPremium(true);
      }

      setCheckingEntitlement(false);
    };

    checkEntitlement();
  }, []);

  // When error changes, parse it and find fix
  useEffect(() => {
    if (error) {
      const parsed = parseErrorMessage(error);
      setParsedError(parsed);

      // Try to find a fix for this error
      const fix = getErrorFixForValidationResult("Sync", error);
      setErrorFix(fix);

      // Auto-show the fix modal if we have a fix
      if (fix) {
        setShowErrorHelp(true);
      }
    } else {
      setParsedError(null);
      setErrorFix(null);
    }
  }, [error]);

  const handleRunSync = () => {
    // Check if user has premium access
    if (!hasPremium && isRevenueCatEnabled()) {
      console.log(`${LOG_PREFIX} User does not have premium, showing paywall`);
      setShowPaywall(true);
      return;
    }

    // User has premium or RevenueCat not enabled, proceed with sync
    runSync();
  };

  const handlePurchaseComplete = async () => {
    console.log(`${LOG_PREFIX} Purchase completed, rechecking entitlement...`);
    setShowPaywall(false);

    // Recheck entitlement
    const result = await hasEntitlement("premium");
    if (result.ok && result.data) {
      setHasPremium(true);
      Alert.alert("Welcome to Pro!", "You can now run unlimited syncs.", [
        { text: "Start Sync", onPress: () => runSync() }
      ]);
    }
  };

  const runSync = async () => {
    if (!projectData || !userId) {
      Alert.alert("Error", "Project data not loaded. Please go back and try again.");
      return;
    }

    console.log("[Sync] ============================================");
    console.log("[Sync] STEP 4 - STARTING SYNC PROCESS");
    console.log("[Sync] Project ID:", projectId);
    console.log("[Sync] ============================================");

    setIsSyncing(true);
    setError(null);
    setBackendFix(null);
    setSyncSucceeded(false);
    setSteps([
      { name: "Preflight Check", status: "pending", message: "Waiting..." },
      { name: "Apple App Store Connect", status: "pending", message: "Waiting..." },
      { name: "RevenueCat Setup", status: "pending", message: "Waiting..." },
      { name: "Finalize", status: "pending", message: "Waiting..." },
    ]);

    try {
      console.log("[Sync] Calling backend sync endpoint with project data...");
      const response = await api.post<SyncRunResponse>(
        `/api/sync/run/${projectId}`,
        { project: projectData }
      );

      if (response.success) {
        console.log("[Sync] ============================================");
        console.log("[Sync] SYNC COMPLETED SUCCESSFULLY");
        console.log("[Sync] Steps completed:", response.steps.length);
        console.log("[Sync] ============================================");
        setSteps(response.steps);
        setSyncSucceeded(true);

        // Update lastSyncAt in Firebase and clear any previous error
        try {
          await updateProject(projectId, userId, {
            lastSyncAt: serverTimestamp() as any,
            syncStatus: "success",
            lastSyncError: null,
          } as Partial<Project>);
          queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        } catch (updateError) {
          console.log("[Sync] Failed to update lastSyncAt:", updateError);
        }
      } else {
        console.log("[Sync] ============================================");
        console.log("[Sync] SYNC FAILED");
        console.log("[Sync] Error:", response.error || "Unknown error");
        console.log("[Sync] ============================================");
        setError(response.error || "Sync failed");
        setSteps(response.steps);

        // Check for fix instructions from backend (in response or in failed step)
        let fix = response.fix;
        if (!fix && response.steps) {
          const failedStep = response.steps.find(s => s.status === 'error' && s.fix);
          if (failedStep?.fix) {
            fix = failedStep.fix;
          }
        }
        if (fix) {
          console.log("[Sync] Backend provided fix instructions:", fix.title);
          setBackendFix(fix);
        }

        // Update sync status in Firebase with error message
        try {
          await updateProject(projectId, userId, {
            syncStatus: "error",
            lastSyncError: response.error || "Sync failed",
          } as Partial<Project>);
        } catch (updateError) {
          console.log("[Sync] Failed to update sync status:", updateError);
        }
      }
    } catch (err: any) {
      console.log("[Sync] ============================================");
      console.log("[Sync] SYNC ERROR - EXCEPTION THROWN");
      console.log("[Sync] Error type:", err?.constructor?.name);
      console.log("[Sync] Error message:", err?.message);
      console.log("[Sync] Full error:", err);
      console.log("[Sync] ============================================");

      // Try to extract backend fix from error response
      try {
        const jsonMatch = err?.message?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Check for fix in response or in failed step
          let fix = parsed.fix;
          if (!fix && parsed.steps) {
            const failedStep = parsed.steps.find((s: any) => s.status === 'error' && s.fix);
            if (failedStep?.fix) {
              fix = failedStep.fix;
            }
          }
          if (fix) {
            console.log("[Sync] Extracted fix from error:", fix.title);
            setBackendFix(fix);
          }
        }
      } catch {
        // Failed to parse, that's okay
      }

      setError(err?.message || "Failed to run sync");
      setSteps([
        {
          name: "Sync Error",
          status: "error",
          message: err?.message || "Failed to run sync",
        },
      ]);

      // Update sync status in Firebase with error message
      try {
        await updateProject(projectId, userId, {
          syncStatus: "error",
          lastSyncError: err?.message || "Failed to run sync",
        } as Partial<Project>);
      } catch (updateError) {
        console.log("[Sync] Failed to update sync status:", updateError);
      }
    } finally {
      setIsSyncing(false);
      console.log("[Sync] Sync process ended");
    }
  };

  if (isLoadingProject) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Loading state while checking entitlement */}
        {checkingEntitlement && (
          <View className="bg-blue-50 rounded-xl p-4 mb-4 flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="text-blue-900 ml-3">Checking subscription status...</Text>
          </View>
        )}

        {/* Premium status banner */}
        {!checkingEntitlement && isRevenueCatEnabled() && (
          <View className={`rounded-xl p-4 mb-4 flex-row items-start ${hasPremium ? "bg-green-50" : "bg-amber-50"}`}>
            <Crown size={20} color={hasPremium ? "#10b981" : "#f59e0b"} className="mt-0.5" />
            <View className="ml-3 flex-1">
              <Text className={`font-semibold mb-1 ${hasPremium ? "text-green-900" : "text-amber-900"}`}>
                {hasPremium ? "Premium Active" : "Free Plan"}
              </Text>
              <Text className={`text-sm ${hasPremium ? "text-green-800" : "text-amber-800"}`}>
                {hasPremium
                  ? "You have unlimited syncs"
                  : "Upgrade to Premium for unlimited syncs"}
              </Text>
            </View>
          </View>
        )}

        <View className="bg-blue-50 rounded-xl p-4 mb-4 flex-row items-start">
          <AlertCircle size={20} color="#3b82f6" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-blue-900 font-semibold mb-1">Before you sync</Text>
            <Text className="text-blue-800 text-sm">
              Make sure you&apos;ve configured your credentials and YAML configuration. This will create products in App Store Connect and RevenueCat.
            </Text>
          </View>
        </View>

        {/* Success Banner */}
        {syncSucceeded && !error && (
          <View className="bg-green-50 rounded-xl p-4 mb-4 border-2 border-green-200">
            <View className="flex-row items-center mb-3">
              <CheckCircle size={24} color="#10b981" />
              <Text className="text-green-900 font-bold text-lg ml-2">IAP Setup Complete!</Text>
            </View>

            <Text className="text-green-800 font-semibold mb-2">What SyncSimp created:</Text>
            <View className="mb-3">
              <Text className="text-green-700 text-sm mb-1">Subscription group in App Store Connect</Text>
              <Text className="text-green-700 text-sm mb-1">In-app purchase products configured</Text>
              <Text className="text-green-700 text-sm mb-1">Pricing and localizations set up</Text>
              <Text className="text-green-700 text-sm mb-1">RevenueCat entitlements created</Text>
              <Text className="text-green-700 text-sm">Products mapped to RevenueCat</Text>
            </View>

            <View className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200">
              <Text className="text-amber-900 font-semibold mb-2">Before App Store Submission</Text>
              <Text className="text-amber-800 text-sm mb-1">
                Your subscriptions are set up, but you still need to:
              </Text>
              <View className="ml-2 mt-2">
                <Text className="text-amber-700 text-sm mb-1">Upload screenshots for all device sizes</Text>
                <Text className="text-amber-700 text-sm mb-1">Add app icon (1024x1024px)</Text>
                <Text className="text-amber-700 text-sm mb-1">Build and submit your app (Vibecode handles this)</Text>
                <Text className="text-amber-700 text-sm mb-1">Test via TestFlight (recommended)</Text>
                <Text className="text-amber-700 text-sm">Fill out App Review information</Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate("ScreenshotTool", { projectId })}
                className="mt-3 bg-amber-600 rounded-lg py-3 px-4 flex-row items-center justify-center"
              >
                <ImageIcon size={18} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">Screenshot Resizer Tool</Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate("VideoTool", { projectId })}
                className="mt-2 bg-purple-600 rounded-lg py-3 px-4 flex-row items-center justify-center"
              >
                <Film size={18} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">App Preview Video Tool</Text>
              </Pressable>
            </View>

            <View className="bg-white rounded-lg p-3 mb-3">
              <Text className="text-slate-900 font-semibold mb-2">Verify Your Setup:</Text>
              <Text className="text-slate-700 text-sm mb-2">
                1. Go to App Store Connect, Your app, &quot;Subscriptions&quot; to see your products
              </Text>
              <Text className="text-slate-700 text-sm">
                2. Go to RevenueCat dashboard, Your project, Check entitlements & offerings
              </Text>
            </View>

            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="text-blue-900 font-semibold mb-1">Integrate RevenueCat:</Text>
              <Text className="text-blue-800 text-xs">
                Install the RevenueCat SDK in your iOS app and configure it with your API key. Then you can start selling subscriptions! Check RevenueCat&apos;s documentation for integration guides.
              </Text>
            </View>
          </View>
        )}

        {/* Error Display - Clean and with auto-fix */}
        {error && parsedError && (
          <View className="bg-red-50 rounded-xl p-4 mb-4 border-2 border-red-200">
            <View className="flex-row items-start mb-3">
              <AlertCircle size={24} color="#ef4444" />
              <View className="ml-3 flex-1">
                <Text className="text-red-900 font-bold text-lg mb-1">Sync Failed</Text>
                <Text className="text-red-800 text-base">{parsedError.displayMessage}</Text>
                {parsedError.failedStep && (
                  <Text className="text-red-600 text-sm mt-1">Step: {parsedError.failedStep}</Text>
                )}
                {parsedError.appleDetail && (
                  <View className="mt-2 bg-red-100 rounded p-2">
                    <Text className="text-red-700 text-xs font-medium">Apple says:</Text>
                    <Text className="text-red-600 text-xs mt-1">{parsedError.appleDetail}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Clear error and retry button */}
            <Pressable
              onPress={async () => {
                console.log(`${LOG_PREFIX} Clearing error to retry sync`);
                setError(null);
                setParsedError(null);
                setErrorFix(null);
                setBackendFix(null);
                setSyncSucceeded(false);
                setSteps([]);
                // Clear error in Firebase
                if (userId) {
                  try {
                    await updateProject(projectId, userId, {
                      syncStatus: "not_synced",
                      lastSyncError: null,
                    } as Partial<Project>);
                    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
                  } catch (e) {
                    console.log(`${LOG_PREFIX} Failed to clear error in Firebase:`, e);
                  }
                }
              }}
              className="bg-green-600 rounded-lg py-3 px-4 mb-4 flex-row items-center justify-center"
            >
              <CheckCircle size={18} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">I Fixed It - Clear Error & Retry</Text>
            </Pressable>

            {/* Backend Fix Instructions - Prioritized over client-side fixes */}
            {backendFix && (
              <View className="bg-white rounded-lg p-4 border border-red-200 mb-4">
                <View className="flex-row items-center mb-3">
                  <Wrench size={20} color="#3b82f6" />
                  <Text className="text-slate-900 font-bold text-base ml-2">{backendFix.title}</Text>
                  <Text className="text-slate-500 text-xs ml-auto">{backendFix.estimatedTime}</Text>
                </View>

                {/* Show steps from backend */}
                {backendFix.steps.map((step, index) => (
                  <View key={index} className="mb-2 pl-2 border-l-2 border-blue-300">
                    <Text className="text-slate-800 text-sm">{index + 1}. {step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Client-side Fix Instructions - Show if no backend fix */}
            {!backendFix && errorFix && (
              <View className="bg-white rounded-lg p-4 border border-red-200">
                <View className="flex-row items-center mb-3">
                  <Wrench size={20} color="#3b82f6" />
                  <Text className="text-slate-900 font-bold text-base ml-2">How to Fix This</Text>
                  {errorFix.estimatedTime && (
                    <Text className="text-slate-500 text-xs ml-auto">{errorFix.estimatedTime}</Text>
                  )}
                </View>

                <Text className="text-slate-700 text-sm mb-3">{errorFix.description}</Text>

                {/* Show steps inline */}
                {errorFix.steps.map((step, index) => (
                  <View key={index} className="mb-3 pl-2 border-l-2 border-blue-300">
                    <Text className="text-slate-900 font-semibold text-sm">{step.number}. {step.instruction}</Text>
                    {step.details && (
                      <Text className="text-slate-600 text-xs mt-1">{step.details}</Text>
                    )}
                  </View>
                ))}

                {/* Common mistakes */}
                {errorFix.commonMistakes && errorFix.commonMistakes.length > 0 && (
                  <View className="mt-3 pt-3 border-t border-slate-200">
                    <Text className="text-amber-800 font-semibold text-xs mb-1">Common Mistakes:</Text>
                    {errorFix.commonMistakes.map((mistake, index) => (
                      <Text key={index} className="text-amber-700 text-xs">- {mistake}</Text>
                    ))}
                  </View>
                )}

                {/* View detailed modal button */}
                <Pressable
                  onPress={() => setShowErrorHelp(true)}
                  className="bg-blue-600 rounded-lg py-2 px-4 mt-3 self-start"
                >
                  <Text className="text-white font-medium text-sm">View Full Instructions</Text>
                </Pressable>
              </View>
            )}

            {/* No fix available */}
            {!backendFix && !errorFix && (
              <View className="bg-white rounded-lg p-3 border border-red-200">
                <Text className="text-slate-700 text-sm">
                  This error is not in our database. Please check your credentials and configuration, then try again.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Error Fix Modal (for detailed view) */}
        {errorFix && (
          <HelpModal
            visible={showErrorHelp}
            onClose={() => setShowErrorHelp(false)}
            title={errorFix.title}
            steps={errorFix.steps.map(step => ({
              title: `Step ${step.number}: ${step.instruction}`,
              description: step.details || ""
            }))}
          />
        )}

        {/* Steps Progress */}
        {steps.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4">
            {steps.map((step, index) => (
              <View key={index} className="py-3 border-b border-slate-100 last:border-b-0">
                <View className="flex-row items-center">
                  {step.status === "pending" && <View className="w-5 h-5 rounded-full bg-slate-200" />}
                  {step.status === "running" && <Loader size={20} color="#3b82f6" />}
                  {step.status === "success" && <CheckCircle size={20} color="#10b981" />}
                  {step.status === "error" && <AlertCircle size={20} color="#ef4444" />}
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold">{step.name}</Text>
                    <Text className="text-sm text-slate-600">{step.message}</Text>
                  </View>
                </View>
                {step.logs && step.logs.length > 0 && (
                  <View className="mt-2 ml-8 p-2 bg-slate-50 rounded">
                    {step.logs.map((log, logIndex) => (
                      <Text key={logIndex} className="text-xs text-slate-600 mb-1">
                        {log}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={handleRunSync}
          disabled={isSyncing || checkingEntitlement || isLoadingProject}
          className={`rounded-lg p-4 items-center ${isSyncing || checkingEntitlement || isLoadingProject ? "bg-slate-400" : "bg-blue-600"}`}
        >
          <Text className="text-white font-semibold">
            {isSyncing ? "Syncing..." : checkingEntitlement || isLoadingProject ? "Loading..." : "Start Sync"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Paywall Modal */}
      <NativePaywall
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </View>
  );
};

export default SyncScreen;
