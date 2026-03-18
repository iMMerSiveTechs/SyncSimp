import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { getProject, updateProject, type Project } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Props = RootStackScreenProps<"EditConfig">;

const DEFAULT_CONFIG = `version: 1

app:
  name: My App
  bundleId: com.company.myapp
  platform: ios

apple:
  subscriptionGroup:
    id: my_subscription_group
    referenceName: My Subscription Group
  locales:
    - id: en-US
      name: English Name
      description: English Description

revenuecat:
  projectId: your_project_id
  iosAppId: your_ios_app_id

entitlements:
  - id: premium
    displayName: Premium Access
    description: Access to all premium features

offerings:
  - id: default
    displayName: Default Offering
    description: Main offering
    primary: true

plans:
  # Subscription example
  - id: pro_monthly
    planId: pro_monthly
    displayName: Pro Monthly
    type: auto_renewable
    appleProductId: com.myapp.pro.monthly
    entitlement: premium
    duration: P1M
    price:
      currency: USD
      amount: 9.99
    introOffer:
      type: free_trial
      duration: P7D
    rc:
      offering: default
      packageId: monthly

  # Lifetime purchase example (non-consumable)
  # - id: lifetime_pro
  #   planId: lifetime_pro
  #   displayName: Lifetime Pro
  #   type: non_consumable
  #   appleProductId: com.myapp.lifetime.pro
  #   entitlement: premium
  #   price:
  #     currency: USD
  #     amount: 49.99
  #   rc:
  #     offering: default
  #     packageId: lifetime

  # Consumable example (coins, credits, etc)
  # - id: coin_pack_100
  #   planId: coin_pack_100
  #   displayName: 100 Coins
  #   type: consumable
  #   appleProductId: com.myapp.coins.100
  #   price:
  #     currency: USD
  #     amount: 4.99
  #   rc:
  #     offering: default
  #     packageId: coins_100`;

const EditConfigScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Fetch project from Firebase
  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const project = await getProject(projectId, userId);
      return project;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (projectData?.configYaml) {
      setConfig(projectData.configYaml);
    }
  }, [projectData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (configYaml: string) => {
      if (!userId) throw new Error("Not logged in");
      const result = await updateProject(projectId, userId, {
        configYaml,
      } as Partial<Project>);
      if (!result.success) {
        throw new Error(result.error || "Failed to save");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      navigation.goBack();
    },
    onError: (error: any) => {
      console.log("Failed to save config:", error);
      Alert.alert("Error", error?.message || "Failed to save configuration");
    },
  });

  const handleSave = () => {
    saveMutation.mutate(config);
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
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-sm text-slate-600 mb-4">
            Edit your vibepay.yml configuration. This defines your in-app products, entitlements, and offerings.
          </Text>
          <TextInput
            value={config}
            onChangeText={setConfig}
            multiline
            textAlignVertical="top"
            className="bg-white rounded-lg p-4 font-mono text-sm flex-1 min-h-96"
            editable={!saveMutation.isPending}
            cursorColor="#3b82f6"
          />
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-200">
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
              <Text className="text-white font-semibold">Save Configuration</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EditConfigScreen;
