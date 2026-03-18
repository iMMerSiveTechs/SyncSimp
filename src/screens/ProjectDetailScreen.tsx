import React, { useLayoutEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Modal } from "react-native";
import { ChevronRight, Circle, CheckCircle2, AlertCircle, Trash2, X, Copy, HelpCircle, ExternalLink } from "lucide-react-native";
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import type { RootStackScreenProps } from "@/navigation/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, deleteProject } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import { HelpModal } from "@/components/HelpModal";

type Props = RootStackScreenProps<"ProjectDetail">;

const ProjectDetailScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAppleSetupHelp, setShowAppleSetupHelp] = useState(false);
  const [showRevenueCatSetupHelp, setShowRevenueCatSetupHelp] = useState(false);

  // Fetch project from Firebase
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId, userId],
    queryFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const projectData = await getProject(projectId, userId);
      return projectData;
    },
    enabled: !!userId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      console.log("[ProjectDetail] Deleting project:", projectId);
      const result = await deleteProject(projectId, userId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete");
      }
      return result;
    },
    onSuccess: () => {
      console.log("[ProjectDetail] Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      navigation.goBack();
    },
    onError: (error) => {
      console.log("[ProjectDetail] Delete failed:", error);
      Alert.alert("Error", "Failed to delete project. Please try again.");
    },
  });

  const handleDeletePress = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    deleteMutation.mutate();
  };

  // Add delete button to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleDeletePress}
          className="mr-4 p-2"
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={22} color="#ef4444" />
        </Pressable>
      ),
    });
  }, [navigation, deleteMutation.isPending]);

  // Determine step completion
  const hasCredentials = !!(
    project?.appleIssuerId &&
    project?.appleKeyId &&
    project?.appleP8FileContent &&
    project?.revenueCatApiKey
  );
  const hasConfig = !!(project?.configYaml);
  const hasValidation = !!(project?.lastCheckAt);
  const hasSynced = project?.syncStatus === "synced" || project?.syncStatus === "success";

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-slate-900">Delete Project?</Text>
              <Pressable onPress={() => setShowDeleteModal(false)}>
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <Text className="text-slate-600 mb-2">
              Are you sure you want to delete &quot;{project?.name}&quot;?
            </Text>

            <Text className="text-sm text-amber-600 mb-6">
              This will permanently delete the project and all its data. This action cannot be undone.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-100 rounded-lg py-3 items-center"
              >
                <Text className="text-slate-700 font-semibold">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteConfirm}
                className="flex-1 bg-red-600 rounded-lg py-3 items-center"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="bg-blue-600 rounded-xl p-5 mb-4">
          <Text className="text-2xl font-bold text-white mb-2">
            Getting Started
          </Text>
          <Text className="text-blue-100 text-sm">
            Follow these steps to set up your in-app purchases. Complete each prerequisite first!
          </Text>
        </View>

        {/* Bundle ID Card */}
        {project?.bundleId && (
          <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
            <Text className="text-sm font-semibold text-slate-700 mb-2">
              Your Bundle ID (copy this - you&apos;ll need it!)
            </Text>
            <View className="flex-row items-center justify-between bg-slate-100 rounded-lg p-3">
              <Text className="text-base font-mono text-slate-900 flex-1">
                {project.bundleId}
              </Text>
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(project.bundleId);
                  Alert.alert("Copied!", "Bundle ID copied to clipboard");
                }}
                className="ml-3 p-2 bg-blue-500 rounded-lg"
              >
                <Copy size={18} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}

        {/* PREREQUISITES SECTION - NEW */}
        <View className="bg-amber-50 rounded-xl p-4 mb-4 border-2 border-amber-300">
          <Text className="text-lg font-bold text-amber-900 mb-2">
            Prerequisites (Do These First!)
          </Text>
          <Text className="text-sm text-amber-800 mb-4">
            You MUST complete these steps in Apple and RevenueCat before SyncSimp can work. Tap each guide for detailed instructions.
          </Text>

          {/* Apple Setup Guide Button */}
          <Pressable
            onPress={() => setShowAppleSetupHelp(true)}
            className="bg-white rounded-lg p-4 mb-3 border border-amber-200 flex-row items-center"
          >
            <View className="bg-gray-900 rounded-lg p-2 mr-3">
              <Text className="text-white text-lg font-bold">A</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-slate-900">Apple Developer Setup</Text>
              <Text className="text-xs text-slate-600">Register Bundle ID, create app, complete agreements</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </Pressable>

          {/* RevenueCat Setup Guide Button */}
          <Pressable
            onPress={() => setShowRevenueCatSetupHelp(true)}
            className="bg-white rounded-lg p-4 mb-3 border border-amber-200 flex-row items-center"
          >
            <View className="bg-purple-600 rounded-lg p-2 mr-3">
              <Text className="text-white text-lg font-bold">R</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-slate-900">RevenueCat Setup</Text>
              <Text className="text-xs text-slate-600">Create project, add iOS app, get API key</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </Pressable>

          {/* Quick Links */}
          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => Linking.openURL('https://developer.apple.com')}
              className="flex-1 bg-gray-900 rounded-lg py-2 px-3 flex-row items-center justify-center"
            >
              <ExternalLink size={14} color="#ffffff" />
              <Text className="text-white text-xs font-medium ml-1">Apple Developer</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL('https://appstoreconnect.apple.com')}
              className="flex-1 bg-blue-600 rounded-lg py-2 px-3 flex-row items-center justify-center"
            >
              <ExternalLink size={14} color="#ffffff" />
              <Text className="text-white text-xs font-medium ml-1">App Store Connect</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL('https://app.revenuecat.com')}
              className="flex-1 bg-purple-600 rounded-lg py-2 px-3 flex-row items-center justify-center"
            >
              <ExternalLink size={14} color="#ffffff" />
              <Text className="text-white text-xs font-medium ml-1">RevenueCat</Text>
            </Pressable>
          </View>
        </View>

        {/* Step-by-Step Checklist */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-bold mb-1">SyncSimp Steps</Text>
          <Text className="text-xs text-slate-500 mb-4">After completing prerequisites above</Text>

          {/* Step 1: Credentials */}
          <Pressable
            onPress={() => navigation.navigate("Credentials", { projectId })}
            className="mb-4"
          >
            <View className="flex-row items-start">
              <View className="mr-3 mt-1">
                {hasCredentials ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : (
                  <Circle size={24} color="#94a3b8" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`font-semibold text-base ${hasCredentials ? "text-green-600" : "text-slate-900"}`}>
                    Step 1: Add Your Credentials
                  </Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
                <Text className="text-sm text-slate-600 mb-2">
                  Enter your Apple API key and RevenueCat API key
                </Text>
                <View className="bg-slate-50 p-3 rounded-lg">
                  <Text className="text-xs text-slate-700 mb-1">You&apos;ll need:</Text>
                  <Text className="text-xs text-slate-600">• Apple Issuer ID, Key ID, and P8 file</Text>
                  <Text className="text-xs text-slate-600">• RevenueCat Public API Key</Text>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Step 2: Configuration */}
          <Pressable
            onPress={() => {
              if (!hasCredentials) {
                Alert.alert("Complete Step 1 First", "Please add your credentials before configuring products.");
                return;
              }
              navigation.navigate("ConfigWizard", { projectId });
            }}
            className="mb-4"
          >
            <View className={`flex-row items-start ${!hasCredentials ? "opacity-50" : ""}`}>
              <View className="mr-3 mt-1">
                {hasConfig ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : hasCredentials ? (
                  <AlertCircle size={24} color="#f59e0b" />
                ) : (
                  <Circle size={24} color="#94a3b8" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`font-semibold text-base ${hasConfig ? "text-green-600" : hasCredentials ? "text-slate-900" : "text-slate-400"}`}>
                    Step 2: Configure Products
                  </Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
                <Text className="text-sm text-slate-600 mb-2">
                  Set up your subscription products and pricing
                </Text>
                <View className="bg-slate-50 p-3 rounded-lg">
                  <Text className="text-xs text-slate-700 mb-1">You&apos;ll need:</Text>
                  <Text className="text-xs text-slate-600">• RevenueCat Project ID (proj_xxxxx)</Text>
                  <Text className="text-xs text-slate-600">• RevenueCat App ID (app_xxxxx)</Text>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Step 3: Validation */}
          <Pressable
            onPress={() => {
              if (!hasCredentials || !hasConfig) {
                Alert.alert("Complete Previous Steps", "Please complete Steps 1 and 2 first.");
                return;
              }
              navigation.navigate("Check", { projectId });
            }}
            className="mb-4"
          >
            <View className={`flex-row items-start ${!hasCredentials || !hasConfig ? "opacity-50" : ""}`}>
              <View className="mr-3 mt-1">
                {hasValidation ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : (
                  <Circle size={24} color={hasCredentials && hasConfig ? "#f59e0b" : "#94a3b8"} />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`font-semibold text-base ${hasCredentials && hasConfig ? "text-slate-900" : "text-slate-400"}`}>
                    Step 3: Run Validation
                  </Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
                <Text className="text-sm text-slate-600">
                  Verify all your credentials and settings work correctly
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Step 4: Sync */}
          <Pressable
            onPress={() => {
              if (!hasCredentials || !hasConfig) {
                Alert.alert("Complete Previous Steps", "Please complete Steps 1-3 first.");
                return;
              }
              navigation.navigate("Sync", { projectId });
            }}
          >
            <View className={`flex-row items-start ${!hasCredentials || !hasConfig ? "opacity-50" : ""}`}>
              <View className="mr-3 mt-1">
                {hasSynced ? (
                  <CheckCircle2 size={24} color="#10b981" />
                ) : hasCredentials && hasConfig ? (
                  <AlertCircle size={24} color="#f59e0b" />
                ) : (
                  <Circle size={24} color="#94a3b8" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className={`font-semibold text-base ${hasSynced ? "text-green-600" : hasCredentials && hasConfig ? "text-slate-900" : "text-slate-400"}`}>
                    Step 4: Run Sync
                  </Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
                <Text className="text-sm text-slate-600">
                  Create products in App Store Connect and RevenueCat
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Apple Setup Help Modal */}
      <HelpModal
        visible={showAppleSetupHelp}
        onClose={() => setShowAppleSetupHelp(false)}
        title="Apple Developer Setup Guide"
        steps={[
          {
            title: "Step 1: Register Your Bundle ID",
            description: `Go to developer.apple.com and sign in.\n\n1. Click "Certificates, Identifiers & Profiles"\n2. Click "Identifiers" in the sidebar\n3. Click the + button (top left)\n4. Select "App IDs" and click Continue\n5. Select "App" and click Continue\n6. Enter:\n   • Description: Your app name\n   • Bundle ID: ${project?.bundleId || 'com.yourcompany.yourapp'}\n7. Scroll down and CHECK "In-App Purchase"\n8. Click Continue, then Register\n\nThis takes about 2 minutes.`,
          },
          {
            title: "Step 2: Create App in App Store Connect",
            description: `Go to appstoreconnect.apple.com and sign in.\n\n1. Click "My Apps"\n2. Click the + button, then "New App"\n3. Fill in:\n   • Platforms: iOS\n   • Name: Your app name\n   • Primary Language: Your language\n   • Bundle ID: Select "${project?.bundleId || 'com.yourcompany.yourapp'}" from dropdown\n   • SKU: Any unique ID (e.g., "${project?.bundleId?.replace(/\./g, '-') || 'your-app-id'}")\n   • User Access: Full Access\n4. Click Create\n\nIf Bundle ID doesn't appear, go back to Step 1.`,
          },
          {
            title: "Step 3: Complete Agreements & Banking",
            description: `CRITICAL - You cannot create in-app purchases without this!\n\n1. In App Store Connect, click "Agreements, Tax, and Banking" (top of page)\n2. Find "Paid Applications Agreement"\n3. Click "Request" or "Sign"\n4. Accept the agreement\n5. Under "Banking", click "Set Up"\n6. Enter your bank account details\n7. Under "Tax", complete your tax forms\n8. Wait until all show "Active"\n\nThis takes 15-30 minutes. Apple may take 24-48 hours to verify banking.`,
          },
          {
            title: "Step 4: Get Your API Credentials",
            description: `Still in App Store Connect:\n\n1. Click "Users and Access" (top menu)\n2. Click "Integrations" tab (or "Keys" on older interface)\n3. Click the + button to create a new key\n4. Name it anything (e.g., "SyncSimp")\n5. Select "App Manager" role\n6. Click Generate\n7. IMPORTANT: Note down your:\n   • Issuer ID (shown at top of page)\n   • Key ID (shown next to your key)\n8. Click "Download API Key" - this downloads the P8 file\n\nYou can only download the P8 file ONCE - save it safely!`,
          },
          {
            title: "What You Should Have Now",
            description: `Before proceeding to SyncSimp Step 1, confirm you have:\n\n✓ Bundle ID registered: ${project?.bundleId || 'com.yourcompany.yourapp'}\n✓ App created in App Store Connect\n✓ Agreements, Tax & Banking all "Active"\n✓ Issuer ID (UUID format)\n✓ Key ID (10 characters)\n✓ P8 file downloaded\n\nIf you're missing anything, go back and complete that step first. SyncSimp cannot work without all of these!`,
          },
        ]}
      />

      {/* RevenueCat Setup Help Modal */}
      <HelpModal
        visible={showRevenueCatSetupHelp}
        onClose={() => setShowRevenueCatSetupHelp(false)}
        title="RevenueCat Setup Guide"
        steps={[
          {
            title: "Step 1: Create RevenueCat Account",
            description: `Go to app.revenuecat.com\n\n1. Click "Sign Up" if you don't have an account\n2. You can sign up with Google, GitHub, or email\n3. Complete the signup process\n4. You'll be taken to your dashboard\n\nRevenueCat is free to start (up to $2,500/month in revenue).`,
          },
          {
            title: "Step 2: Create a Project",
            description: `In your RevenueCat dashboard:\n\n1. Click "Create Project" or the + button\n2. Enter a project name (e.g., your app name)\n3. Click "Create Project"\n\nNote: A "Project" in RevenueCat can contain multiple apps (iOS, Android, etc.)`,
          },
          {
            title: "Step 3: Add Your iOS App",
            description: `Inside your new project:\n\n1. Click "Apps" in the left sidebar\n2. Click "+ New" button\n3. Select "Apple App Store"\n4. Enter your Bundle ID: ${project?.bundleId || 'com.yourcompany.yourapp'}\n5. Give it a name (e.g., "iOS App")\n6. Click "Add App"\n\nIMPORTANT: The Bundle ID MUST match exactly what you registered in Apple Developer!`,
          },
          {
            title: "Step 4: Get Your API Key",
            description: `Now get your PUBLIC API key:\n\n1. Click on your project name in the left sidebar\n2. Click the gear icon (⚙️) next to your project name\n   OR click "Project Settings"\n3. Click "API Keys" tab\n4. Find the "Public app-specific API keys" section\n5. Copy the key for your iOS app\n   • It should start with "appl_"\n\nIMPORTANT: Use the PUBLIC key, NOT the secret key!\n\nThis is what you'll enter in SyncSimp Step 1.`,
          },
          {
            title: "Step 5: Get Project ID and App ID",
            description: `You'll need these for SyncSimp Step 2:\n\nProject ID:\n1. Click the gear icon (⚙️) next to your project name\n2. Look at the top of the settings page\n3. Copy "Project ID: proj_xxxxxxxxxx"\n\nApp ID:\n1. Click "Apps" in the left sidebar\n2. Click on your iOS app\n3. Look at the top of the page\n4. Copy "App ID: app_xxxxxxxxxx"\n\nNOTE: App ID is NOT your Bundle ID!`,
          },
          {
            title: "What You Should Have Now",
            description: `Before proceeding to SyncSimp, confirm you have:\n\n✓ RevenueCat account created\n✓ Project created in RevenueCat\n✓ iOS app added with Bundle ID: ${project?.bundleId || 'com.yourcompany.yourapp'}\n✓ Public API Key (starts with "appl_")\n✓ Project ID (starts with "proj_")\n✓ App ID (starts with "app_")\n\nYou'll enter:\n• API Key in Step 1 (Credentials)\n• Project ID and App ID in Step 2 (Configuration)`,
          },
        ]}
      />
    </View>
  );
};

export default ProjectDetailScreen;
