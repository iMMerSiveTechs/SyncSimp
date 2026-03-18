import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { getProject, updateProject, type Project } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from 'expo-document-picker';
import { HelpCircle, Save, Check } from "lucide-react-native";
import { HelpModal } from "@/components/HelpModal";

type Props = RootStackScreenProps<"Credentials">;

const CredentialsScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [appleIssuerId, setAppleIssuerId] = useState("");
  const [appleKeyId, setAppleKeyId] = useState("");
  const [appleP8FileContent, setAppleP8FileContent] = useState("");
  const [p8FileName, setP8FileName] = useState("");
  const [revenueCatApiKey, setRevenueCatApiKey] = useState("");
  const [showAppleHelp, setShowAppleHelp] = useState(false);
  const [showRevenueCatHelp, setShowRevenueCatHelp] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValuesRef = useRef<string>("");

  // Fetch existing credentials from Firebase
  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project", projectId, userId],
    queryFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const project = await getProject(projectId, userId);
      return project;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-save mutation (silent, no alerts)
  const autoSaveMutation = useMutation({
    mutationFn: async (values: { appleIssuerId: string; appleKeyId: string; appleP8FileContent: string; revenueCatApiKey: string }) => {
      if (!userId) throw new Error("Not logged in");

      console.log("[Credentials] Auto-saving credentials...");

      const result = await updateProject(projectId, userId, {
        appleIssuerId: values.appleIssuerId || null,
        appleKeyId: values.appleKeyId || null,
        appleP8FileContent: values.appleP8FileContent || null,
        revenueCatApiKey: values.revenueCatApiKey || null,
      } as Partial<Project>);

      if (!result.success) {
        throw new Error(result.error || "Failed to save");
      }
      return result;
    },
    onSuccess: () => {
      setSaveStatus('saved');
      console.log("[Credentials] ✅ Auto-save successful");
      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: (error: any) => {
      setSaveStatus('idle');
      console.log("[Credentials] ⚠️ Auto-save failed:", error.message || error);
    },
  });

  // Manual save mutation (with success alert)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");

      console.log("[Credentials] Manual save initiated");

      const result = await updateProject(projectId, userId, {
        appleIssuerId: appleIssuerId.trim() || null,
        appleKeyId: appleKeyId.trim() || null,
        appleP8FileContent: appleP8FileContent.trim() || null,
        revenueCatApiKey: revenueCatApiKey.trim() || null,
      } as Partial<Project>);

      if (!result.success) {
        throw new Error(result.error || "Failed to save");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      console.log("[Credentials] ✅ Manual save successful!");
      Alert.alert("Success", "Credentials saved successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      console.log("[Credentials] ✗ MANUAL SAVE FAILED:", error.message || error);
      Alert.alert("Error", error?.message || "Failed to save credentials");
    },
  });

  // Load existing credentials when data is fetched (ONLY ONCE)
  useEffect(() => {
    if (projectData && !hasLoadedInitialData) {
      if (projectData.appleIssuerId) setAppleIssuerId(projectData.appleIssuerId);
      if (projectData.appleKeyId) setAppleKeyId(projectData.appleKeyId);
      if (projectData.appleP8FileContent) {
        setAppleP8FileContent(projectData.appleP8FileContent);
        setP8FileName("✓ P8 key loaded");
      }
      if (projectData.revenueCatApiKey) setRevenueCatApiKey(projectData.revenueCatApiKey);

      // Store initial values to compare against
      lastSavedValuesRef.current = JSON.stringify({
        appleIssuerId: projectData.appleIssuerId || "",
        appleKeyId: projectData.appleKeyId || "",
        appleP8FileContent: projectData.appleP8FileContent || "",
        revenueCatApiKey: projectData.revenueCatApiKey || "",
      });

      setHasLoadedInitialData(true);
    }
  }, [projectData, hasLoadedInitialData]);

  // Auto-save when fields change (debounced) - simpler approach without callback deps issues
  useEffect(() => {
    // Only auto-save if we've loaded initial data
    if (!hasLoadedInitialData || !userId) return;

    const currentValues = JSON.stringify({
      appleIssuerId: appleIssuerId.trim(),
      appleKeyId: appleKeyId.trim(),
      appleP8FileContent: appleP8FileContent.trim(),
      revenueCatApiKey: revenueCatApiKey.trim(),
    });

    // Don't save if nothing changed
    if (currentValues === lastSavedValuesRef.current) {
      return;
    }

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set saving indicator
    setSaveStatus('saving');

    // Set new timer for 1.5 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      const values = {
        appleIssuerId: appleIssuerId.trim(),
        appleKeyId: appleKeyId.trim(),
        appleP8FileContent: appleP8FileContent.trim(),
        revenueCatApiKey: revenueCatApiKey.trim(),
      };

      // Update last saved values before saving
      lastSavedValuesRef.current = JSON.stringify(values);

      autoSaveMutation.mutate(values);
    }, 1500);

    // Cleanup timer on unmount or when deps change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [appleIssuerId, appleKeyId, appleP8FileContent, revenueCatApiKey, hasLoadedInitialData, userId]);

  const handlePickP8File = async () => {
    try {
      console.log("[Credentials] Opening P8 file picker...");
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/octet-stream', 'application/x-pem-file', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log("[Credentials] P8 file selected:", file.name);

        // Read file content
        const response = await fetch(file.uri);
        const text = await response.text();

        // Validate P8 file content
        if (!text.includes('-----BEGIN PRIVATE KEY-----')) {
          Alert.alert("Invalid File", "This does not appear to be a valid .p8 private key file. The file should contain '-----BEGIN PRIVATE KEY-----'.");
          return;
        }

        console.log("[Credentials] P8 file loaded successfully");
        setAppleP8FileContent(text);
        setP8FileName(file.name || "P8 key selected");

        // Auto-extract Key ID from filename (e.g., AuthKey_PYU9ZW4J5U.p8 -> PYU9ZW4J5U)
        const keyIdMatch = file.name.match(/AuthKey_([A-Z0-9]+)\.p8/i);
        if (keyIdMatch && keyIdMatch[1]) {
          const extractedKeyId = keyIdMatch[1];
          console.log("[Credentials] ✓ Auto-extracted Key ID from filename:", extractedKeyId);
          setAppleKeyId(extractedKeyId);
          Alert.alert(
            "Key ID Detected",
            `Found Key ID "${extractedKeyId}" from filename. This has been filled in automatically.`,
            [{ text: "OK" }]
          );
        }
      } else {
        console.log("[Credentials] P8 file picker canceled");
      }
    } catch (error) {
      console.log("[Credentials] ✗ ERROR LOADING P8 FILE:", error);
      Alert.alert("Error", "Failed to read P8 file. Please try again.");
    }
  };

  const handleSave = () => {
    console.log("[Credentials] USER CLICKED SAVE - VALIDATING FIELDS");

    // Validate required fields
    const missingFields: string[] = [];
    if (!appleIssuerId.trim()) missingFields.push("Apple Issuer ID");
    if (!appleKeyId.trim()) missingFields.push("Apple Key ID");
    if (!appleP8FileContent.trim()) missingFields.push("P8 File");
    if (!revenueCatApiKey.trim()) missingFields.push("RevenueCat API Key");

    if (missingFields.length > 0) {
      console.log("[Credentials] ✗ Validation failed - missing fields:", missingFields.join(", "));
      Alert.alert("Missing Information", `Please provide: ${missingFields.join(", ")}`);
      return;
    }

    console.log("[Credentials] ✓ All fields validated - proceeding with save");
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Auto-save indicator */}
        {saveStatus !== 'idle' && (
          <View className={`rounded-lg p-3 mb-4 flex-row items-center ${
            saveStatus === 'saving' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
          }`}>
            {saveStatus === 'saving' ? (
              <>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-blue-800 text-xs ml-2">Saving...</Text>
              </>
            ) : (
              <>
                <Check size={16} color="#16a34a" />
                <Text className="text-green-800 text-xs ml-2">Saved</Text>
              </>
            )}
          </View>
        )}

        {/* Apple Help Modal */}
        <HelpModal
          visible={showAppleHelp}
          onClose={() => setShowAppleHelp(false)}
          title="How to Get Apple Credentials"
          steps={[
            {
              title: "Navigate to App Store Connect",
              description: "Go to appstoreconnect.apple.com and sign in with your Apple account. Then navigate to: Users and Access → Keys (or Integrations if you don't see Keys)",
            },
            {
              title: "Find Your Issuer ID",
              description: "At the top of the Keys (or Integrations) page, you'll see your Issuer ID. It looks like: 12345678-1234-1234-1234-123456789012. Copy this value.",
            },
            {
              title: "Generate an API Key",
              description: "Click the + button to generate a new key. Give it a name (e.g., 'SyncSymp') and select 'App Manager' as the role. This role is required to create and manage in-app purchases.",
            },
            {
              title: "Get Your Key ID",
              description: "After creating the key, you'll see it in the list with a Key ID (10 alphanumeric characters). Copy this value.",
            },
            {
              title: "Download the P8 File",
              description: "Click 'Download API Key' to download the .p8 file. ⚠️ IMPORTANT: You can only download this file ONCE! Store it securely. If you lose it, you'll need to create a new key.",
            },
          ]}
        />

        {/* RevenueCat Help Modal */}
        <HelpModal
          visible={showRevenueCatHelp}
          onClose={() => setShowRevenueCatHelp(false)}
          title="How to Get RevenueCat SECRET API Key (V2)"
          steps={[
            {
              title: "Navigate to RevenueCat Dashboard",
              description: "Go to app.revenuecat.com and sign in to your account. If you don't have an account, create one first (it's free to start).",
            },
            {
              title: "Open Project Settings",
              description: "Click the gear icon ⚙️ in the bottom left to open Project Settings, OR click your project name and select 'Project Settings'.",
            },
            {
              title: "Go to API Keys Section",
              description: "In Project Settings, click on 'API Keys' in the sidebar. You'll see TWO sections: 'SDK API keys' (for mobile apps) and 'Secret API keys' (for server/API access).",
            },
            {
              title: "⚠️ Create SECRET Key with Read & Write Access",
              description: "Scroll DOWN past 'SDK API keys'. In 'Secret API keys' section, click '+ New secret API key'. Name it 'SyncSimp'. Select 'Read and Write' access (V2 API). Copy the key starting with 'sk_'. Do NOT use appl_xxx keys!",
            },
          ]}
        />

        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold">Apple App Store Connect</Text>
            <Pressable
              onPress={() => setShowAppleHelp(true)}
              className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg"
            >
              <HelpCircle size={18} color="#3b82f6" />
              <Text className="text-blue-600 font-medium ml-2">Need Help?</Text>
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 mb-2">Issuer ID</Text>
            <TextInput
              value={appleIssuerId}
              onChangeText={setAppleIssuerId}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoCapitalize="none"
              className="bg-slate-50 rounded-lg p-4 text-base"
              cursorColor="#3b82f6"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 mb-2">Key ID</Text>
            <TextInput
              value={appleKeyId}
              onChangeText={setAppleKeyId}
              placeholder="XXXXXXXXXX"
              autoCapitalize="none"
              className="bg-slate-50 rounded-lg p-4 text-base"
              cursorColor="#3b82f6"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 mb-2">P8 Private Key File</Text>
            <Pressable
              onPress={handlePickP8File}
              className="bg-slate-50 rounded-lg p-4 border border-slate-300"
            >
              <Text className={p8FileName ? "text-slate-900" : "text-slate-500"}>
                {p8FileName || "Tap to select P8 file..."}
              </Text>
            </Pressable>
            <Text className="text-xs text-slate-500 mt-1">
              Upload your .p8 private key file from App Store Connect
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold">RevenueCat</Text>
            <Pressable
              onPress={() => setShowRevenueCatHelp(true)}
              className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg"
            >
              <HelpCircle size={18} color="#3b82f6" />
              <Text className="text-blue-600 font-medium ml-2">Need Help?</Text>
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 mb-1">SECRET API Key (V2)</Text>
            <Text className="text-xs text-red-600 mb-2">{"⚠️ Must start with \"sk_\" and have Read & Write access"}</Text>
            <TextInput
              value={revenueCatApiKey}
              onChangeText={setRevenueCatApiKey}
              placeholder="sk_xxxxxxxxxxxxxxxxxxxxxxxx"
              autoCapitalize="none"
              secureTextEntry
              className="bg-slate-50 rounded-lg p-4 text-base"
              cursorColor="#3b82f6"
            />
            <Text className="text-xs text-slate-500 mt-1">
              {"Project Settings → API Keys → \"Secret API keys\" → Read & Write access"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saveMutation.isPending}
          className={`rounded-lg p-4 items-center ${
            saveMutation.isPending ? "bg-slate-400" : "bg-blue-600"
          }`}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Save Credentials</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CredentialsScreen;
