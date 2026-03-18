import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { createProject } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";

type Props = RootStackScreenProps<"CreateProject">;

const CreateProjectScreen = ({ navigation }: Props) => {
  const [name, setName] = useState("");
  const [bundleId, setBundleId] = useState("");
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const createProjectMutation = useMutation({
    mutationFn: async ({ name, bundleId }: { name: string; bundleId: string }) => {
      if (!session?.user?.id) {
        throw new Error("Not logged in");
      }
      const project = await createProject(session.user.id, name, bundleId);
      if (!project) {
        throw new Error("Failed to create project");
      }
      return project;
    },
    onSuccess: () => {
      // Invalidate projects query to refetch the list
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create project");
    },
  });

  const handleCreate = () => {
    if (!name || !bundleId) return;

    createProjectMutation.mutate({ name, bundleId });
  };

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
        <Text className="text-lg font-semibold mb-4">Project Details</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-slate-700 mb-2">App Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="My Awesome App"
            className="bg-white rounded-lg p-4 text-base"
            cursorColor="#3b82f6"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-700 mb-2">Bundle ID</Text>

          {/* Critical Warning Banner */}
          <View className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-3">
            <View className="flex-row items-start mb-2">
              <AlertTriangle size={20} color="#dc2626" />
              <Text className="text-red-900 font-bold text-base ml-2 flex-1">CRITICAL: This MUST Match Everywhere</Text>
            </View>
            <Text className="text-red-800 font-semibold text-sm mb-2">
              If using Vibecode&apos;s publish system, you CANNOT use a custom bundle ID.
            </Text>
            <Text className="text-red-700 text-sm mb-2">
              Vibecode auto-generates: <Text className="font-mono font-bold">com.vibecode.{'{appname}'}-{'{random}'}</Text>
            </Text>
            <Text className="text-red-700 text-sm mb-2">
              You MUST use that exact bundle ID here, in App Store Connect, and RevenueCat. No exceptions.
            </Text>
            <Text className="text-red-700 text-sm font-semibold">
              Cannot be changed after creating the app in App Store Connect
            </Text>
          </View>

          <View className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-3">
            <Text className="text-amber-900 font-semibold text-sm mb-1">
              Format: com.company.appname (lowercase, no spaces)
            </Text>
            <Text className="text-amber-800 text-xs mb-1">
              Must match EXACTLY in: App Store Connect, RevenueCat, app.json
            </Text>
            <Text className="text-amber-800 text-xs">
              If using Vibecode publish: Check your build logs for the actual bundle ID first!
            </Text>
          </View>

          <TextInput
            value={bundleId}
            onChangeText={setBundleId}
            placeholder="com.vibecode.syncsimp-aztxrv"
            autoCapitalize="none"
            className="bg-white rounded-lg p-4 text-base font-mono"
            cursorColor="#3b82f6"
          />
          <Text className="text-xs text-slate-500 mt-2">
            Double-check this is EXACTLY what Vibecode generated if using their publish system
          </Text>
        </View>

        <Pressable
          onPress={handleCreate}
          disabled={!name || !bundleId || createProjectMutation.isPending}
          className={`rounded-lg p-4 items-center ${
            name && bundleId && !createProjectMutation.isPending ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <Text className="text-white font-semibold">
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateProjectScreen;
