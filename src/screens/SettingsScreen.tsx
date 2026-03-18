import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from "react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import LoginButton from "@/components/LoginButton";
import { resetOnboarding } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import { RefreshCw, Image as ImageIcon, Film, ExternalLink, FileText, Shield } from "lucide-react-native";

// Privacy Policy and Terms of Use - Google Docs links (keep in sync with NativePaywall.tsx)
const PRIVACY_POLICY_URL = "https://docs.google.com/document/d/1-rUhacC7RZH0fvQhNoDauC_nNbhAGNBhjJ8-fYf7Yv8/edit?usp=sharing";
const TERMS_OF_USE_URL = "https://docs.google.com/document/d/10P3sxn43jlNxm4REP95BF-GPrVWYtQIZ6m4vc-hQ-kM/edit?usp=sharing";

type Props = BottomTabScreenProps<"SettingsTab">;

const SettingsScreen = ({ navigation }: Props) => {
  const [isResetting, setIsResetting] = useState(false);
  const { data: session } = useSession();

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error("[Settings] Failed to open URL:", err);
      Alert.alert("Error", "Unable to open link. Please try again.");
    });
  };

  const handleResetOnboarding = async () => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to reset onboarding.");
      return;
    }

    Alert.alert(
      "Reset Onboarding",
      "This will reset your onboarding status so you can take screenshots. You'll need to force quit and reopen the app after this.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);
            try {
              const result = await resetOnboarding(session.user.id);
              if (result.success) {
                Alert.alert(
                  "Onboarding Reset",
                  "Onboarding has been reset. Please:\n\n1. Force quit the app (swipe up from app switcher)\n2. Reopen the app\n3. You'll see the onboarding flow for screenshots",
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert("Error", "Failed to reset onboarding. Please try again.");
              }
            } catch (error: any) {
              console.error("[Settings] Failed to reset onboarding:", error);
              Alert.alert("Error", "Failed to reset onboarding. Please try again.");
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-900">Settings</Text>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-4">Account</Text>
          <LoginButton />
        </View>

        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">App Store Tools</Text>

          <Pressable
            onPress={() => navigation.navigate("ScreenshotTool", { projectId: "none" })}
            className="bg-blue-600 rounded-lg p-4 flex-row items-center justify-center active:opacity-80 mb-3"
          >
            <ImageIcon size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Screenshot Resizer Tool
            </Text>
          </Pressable>
          <Text className="text-xs text-slate-500 mb-4">
            Resize your screenshots to all required App Store sizes (iPhone 6.7&quot;, 6.5&quot;, 5.5&quot;, iPad Pro 12.9&quot;, 11&quot;)
          </Text>

          <Pressable
            onPress={() => navigation.navigate("VideoTool", { projectId: "none" })}
            className="bg-purple-600 rounded-lg p-4 flex-row items-center justify-center active:opacity-80 mb-3"
          >
            <Film size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              App Preview Video Tool
            </Text>
          </Pressable>
          <Text className="text-xs text-slate-500 mb-4">
            View required video dimensions and technical requirements for App Store preview videos
          </Text>

          {session && (
            <>
              <Pressable
                onPress={handleResetOnboarding}
                disabled={isResetting}
                className="bg-orange-500 rounded-lg p-4 flex-row items-center justify-center active:opacity-80"
              >
                {isResetting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <RefreshCw size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Reset Onboarding (for Screenshots)
                    </Text>
                  </>
                )}
              </Pressable>
              <Text className="text-xs text-slate-500 mt-2">
                Use this to trigger the onboarding flow again for taking App Store screenshots
              </Text>
            </>
          )}
        </View>

        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Legal</Text>

          <Pressable
            onPress={() => openLink(PRIVACY_POLICY_URL)}
            className="flex-row items-center justify-between py-3 border-b border-slate-100"
          >
            <View className="flex-row items-center">
              <Shield size={20} color="#6b7280" />
              <Text className="text-slate-900 font-medium ml-3">Privacy Policy</Text>
            </View>
            <ExternalLink size={18} color="#9ca3af" />
          </Pressable>

          <Pressable
            onPress={() => openLink(TERMS_OF_USE_URL)}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <FileText size={20} color="#6b7280" />
              <Text className="text-slate-900 font-medium ml-3">Terms of Use</Text>
            </View>
            <ExternalLink size={18} color="#9ca3af" />
          </Pressable>
        </View>

        <View className="bg-white rounded-xl p-4">
          <Text className="text-sm text-slate-600">
            SyncSimp v1.0.0
          </Text>
          <Text className="text-sm text-slate-600 mt-2">
            Sync simple. Calm engineering for in-app purchases.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
