import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { CheckCircle, XCircle, Loader, HelpCircle } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { api } from "@/lib/api";
import { getProject, updateProject, type Project } from "@/lib/firebase";
import { serverTimestamp } from "firebase/firestore";
import { useSession } from "@/lib/useSession";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ValidationCheckResponse } from "@/shared/contracts";
import ErrorFixModal from "@/components/ErrorFixModal";
import { getErrorFixForValidationResult, type ErrorFix } from "@/constants/errorFixes";

type Props = RootStackScreenProps<"Check">;

type CheckItemStatus = "success" | "error" | "pending";

interface CheckItem {
  name: string;
  status: CheckItemStatus;
  message: string;
}

const CheckScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CheckItem[]>([]);
  const [selectedErrorFix, setSelectedErrorFix] = useState<ErrorFix | null>(null);
  const [showFixModal, setShowFixModal] = useState(false);

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

  const runCheck = async () => {
    if (!projectData || !userId) {
      setResults([{
        name: "Error",
        status: "error",
        message: "Project data not loaded. Please go back and try again.",
      }]);
      return;
    }

    console.log("[Check] ============================================");
    console.log("[Check] STEP 3 - STARTING VALIDATION CHECK");
    console.log("[Check] Project ID:", projectId);
    console.log("[Check] This will test all credentials and configurations");
    console.log("[Check] ============================================");

    setIsChecking(true);
    setResults([
      { name: "Apple Credentials", status: "pending", message: "Checking..." },
      { name: "App Store Connect", status: "pending", message: "Checking..." },
      { name: "RevenueCat Connection", status: "pending", message: "Checking..." },
      { name: "Configuration Valid", status: "pending", message: "Checking..." },
    ]);

    try {
      console.log("[Check] Calling backend validation endpoint with project data...");

      // Send project data to backend for validation
      const response = await api.post<ValidationCheckResponse>(
        `/api/validation/check/${projectId}`,
        { project: projectData }
      );

      console.log("[Check] ✓ Received validation response from backend");
      const { result } = response;

      const newResults: CheckItem[] = [];

      // Apple Credentials
      if (result.local.hasAllCredentials) {
        newResults.push({
          name: "Apple Credentials",
          status: result.apple.apiKeyValid ? "success" : "error",
          message: result.apple.apiKeyValid
            ? "✓ Valid credentials"
            : `✗ ${result.apple.error || "Invalid credentials"}`,
        });

        // App Store Connect
        newResults.push({
          name: "App Store Connect",
          status: result.apple.appFound ? "success" : "error",
          message: result.apple.appFound
            ? "✓ App found"
            : `✗ ${result.apple.error || "App not found in App Store Connect"}`,
        });

        // RevenueCat Connection
        newResults.push({
          name: "RevenueCat Connection",
          status: result.revenuecat.projectOk ? "success" : "error",
          message: result.revenuecat.projectOk
            ? "✓ Connected"
            : `✗ ${result.revenuecat.error || "Connection failed"}`,
        });

        // Configuration Valid
        const configValid =
          result.apple.apiKeyValid &&
          result.apple.appFound &&
          result.revenuecat.projectOk &&
          result.revenuecat.iapKeyPresent &&
          result.revenuecat.ascKeyPresent;

        let configMessage = "✓ All checks passed";
        if (!configValid) {
          const issues: string[] = [];
          if (!result.apple.apiKeyValid) issues.push("Apple credentials invalid");
          if (!result.apple.appFound) issues.push("App not in App Store Connect");
          if (!result.revenuecat.projectOk) issues.push("RevenueCat connection failed");
          if (!result.revenuecat.iapKeyPresent) issues.push("Missing IAP Shared Secret in RevenueCat");
          if (!result.revenuecat.ascKeyPresent) issues.push("Missing App Store Connect key in RevenueCat");
          configMessage = `✗ Issues: ${issues.join(", ")}`;
        }

        newResults.push({
          name: "Configuration Valid",
          status: configValid ? "success" : "error",
          message: configMessage,
        });
      } else {
        newResults.push({
          name: "Apple Credentials",
          status: "error",
          message: "Missing credentials",
        });
        newResults.push({
          name: "App Store Connect",
          status: "error",
          message: "Cannot check - missing credentials",
        });
        newResults.push({
          name: "RevenueCat Connection",
          status: "error",
          message: "Cannot check - missing credentials",
        });
        newResults.push({
          name: "Configuration Valid",
          status: "error",
          message: result.local.error || "Missing required credentials",
        });
      }

      setResults(newResults);

      // Update lastCheckAt in Firebase
      try {
        await updateProject(projectId, userId, {
          lastCheckAt: serverTimestamp(),
        } as unknown as Partial<Project>);
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        console.log("[Check] ✓ Updated lastCheckAt in Firebase");
      } catch (updateError) {
        console.log("[Check] Failed to update lastCheckAt:", updateError);
      }

      // Log summary
      console.log("[Check] ============================================");
      console.log("[Check] VALIDATION CHECK COMPLETE");
      console.log("[Check] Apple Credentials:", result.apple.apiKeyValid ? "✓ Valid" : "✗ Invalid");
      console.log("[Check] App in App Store Connect:", result.apple.appFound ? "✓ Found" : "✗ Not Found");
      console.log("[Check] RevenueCat Connection:", result.revenuecat.projectOk ? "✓ Connected" : "✗ Failed");
      console.log("[Check] IAP Shared Secret:", result.revenuecat.iapKeyPresent ? "✓ Present" : "✗ Missing");
      console.log("[Check] ASC Key in RevenueCat:", result.revenuecat.ascKeyPresent ? "✓ Present" : "✗ Missing");
      console.log("[Check] Overall Status:", newResults.every(r => r.status === "success") ? "✅ ALL CHECKS PASSED" : "❌ SOME CHECKS FAILED");
      console.log("[Check] ============================================");
    } catch (error: any) {
      console.log("[Check] ============================================");
      console.log("[Check] ✗ VALIDATION CHECK ERROR");
      console.log("[Check] Error type:", error?.constructor?.name);
      console.log("[Check] Error message:", error?.message);
      console.log("[Check] Full error:", JSON.stringify(error, null, 2));
      console.log("[Check] ============================================");

      // Provide user-friendly error message
      let userMessage = "Failed to run validation check";
      if (error?.message?.includes("502") || error?.message?.includes("Bad Gateway")) {
        userMessage = "Backend server is temporarily unavailable. Please try again in a moment.";
      } else if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        userMessage = "Session expired. Please restart the app.";
      } else if (error?.message) {
        userMessage = error.message;
      }

      setResults([
        {
          name: "Validation Error",
          status: "error",
          message: userMessage,
        },
      ]);
    } finally {
      setIsChecking(false);
      console.log("[Check] Validation check process ended");
    }
  };

  // Check if all results passed
  const allPassed = results.length > 0 && results.every(r => r.status === "success");
  const hasErrors = results.some(r => r.status === "error");

  // Handle showing fix instructions for an error
  const showFixInstructions = (checkName: string, errorMessage: string) => {
    const errorFix = getErrorFixForValidationResult(checkName, errorMessage);
    if (errorFix) {
      setSelectedErrorFix(errorFix);
      setShowFixModal(true);
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
        {/* Instructions - only show if not checked yet */}
        {results.length === 0 && (
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <Text className="text-blue-900 font-semibold mb-2">
              What to do:
            </Text>
            <Text className="text-blue-800 text-sm mb-2">
              1. Tap the &quot;Run Validation Check&quot; button below
            </Text>
            <Text className="text-blue-800 text-sm mb-2">
              2. Wait for all 4 checks to complete (~10 seconds)
            </Text>
            <Text className="text-blue-800 text-sm mb-3">
              3. Review the results - specific error messages will tell you what to fix
            </Text>
            <View className="border-t border-blue-200 pt-3">
              <Text className="text-blue-900 font-semibold text-xs mb-1">
                💡 Detailed Logs Available:
              </Text>
              <Text className="text-blue-800 text-xs">
                For technical debugging, detailed logs are written to the backend. Ask your developer to check &quot;backend/server.log&quot; for complete validation traces.
              </Text>
            </View>
          </View>
        )}

        {/* Success message */}
        {allPassed && (
          <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <Text className="text-green-900 font-semibold mb-1">
              ✓ All checks passed!
            </Text>
            <Text className="text-green-800 text-sm">
              Your credentials and configuration are valid. You can now proceed to Step 4 to run the sync.
            </Text>
          </View>
        )}

        {/* Error message */}
        {hasErrors && !allPassed && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <Text className="text-red-900 font-semibold mb-1">
              ✕ Some checks failed
            </Text>
            <Text className="text-red-800 text-sm mb-2">
              Check the detailed error messages below. Common fixes:
            </Text>
            <Text className="text-red-800 text-sm mb-1">
              • &quot;App not found&quot;: Create your app in App Store Connect with the exact bundle ID
            </Text>
            <Text className="text-red-800 text-sm mb-1">
              • RevenueCat fails: Verify API key in Step 1 and Project/App IDs in Step 2
            </Text>
            <Text className="text-red-800 text-sm mb-1">
              • Missing IAP/ASC keys: Add them in RevenueCat app settings
            </Text>
            <Text className="text-red-800 text-sm">
              • Credentials fail: Re-check Issuer ID, Key ID, and P8 file in Step 1
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4">
            {results.map((result, index) => (
              <View key={index} className="mb-4 last:mb-0">
                <View className="flex-row items-start py-2">
                  <View className="mt-0.5">
                    {result.status === "pending" && <Loader size={20} color="#64748b" />}
                    {result.status === "success" && <CheckCircle size={20} color="#10b981" />}
                    {result.status === "error" && <XCircle size={20} color="#ef4444" />}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-base mb-1">{result.name}</Text>
                    <Text className={`text-sm leading-5 ${result.status === "error" ? "text-red-700" : "text-slate-600"}`}>
                      {result.message}
                    </Text>

                    {/* Show "How to Fix" button for errors */}
                    {result.status === "error" && (
                      <Pressable
                        onPress={() => showFixInstructions(result.name, result.message)}
                        className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex-row items-center"
                      >
                        <HelpCircle size={16} color="#2563eb" />
                        <Text className="text-blue-700 font-semibold text-sm ml-2">
                          How to Fix This
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                {index < results.length - 1 && <View className="h-px bg-slate-200 mt-2" />}
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={runCheck}
          disabled={isChecking}
          className={`rounded-lg p-4 items-center ${isChecking ? "bg-slate-400" : "bg-green-600"}`}
        >
          <Text className="text-white font-semibold">
            {isChecking ? "Checking..." : results.length > 0 ? "Run Check Again" : "Run Validation Check"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Error Fix Modal */}
      {selectedErrorFix && (
        <ErrorFixModal
          visible={showFixModal}
          onClose={() => setShowFixModal(false)}
          errorFix={selectedErrorFix}
        />
      )}
    </View>
  );
};

export default CheckScreen;
