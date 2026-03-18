import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, Shield, Clock, Sparkles } from "lucide-react-native";
import type { RootStackParamList } from "@/navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "OnboardingFeatures">;

const OnboardingFeaturesScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const features = [
    {
      icon: Zap,
      title: "Step-by-Step Guidance",
      description:
        "Clear tutorials walk you through every step - from credentials to product setup. Never feel lost or confused.",
    },
    {
      icon: Shield,
      title: "Automated Sync",
      description:
        "After you configure, one button syncs everything. Creates subscription groups, products, and offerings across both platforms.",
    },
    {
      icon: Clock,
      title: "Save Hours of Manual Work",
      description:
        "No more copying IDs between platforms or double-checking configurations. Set it up once, sync everywhere.",
    },
    {
      icon: Sparkles,
      title: "Validation & Error Prevention",
      description:
        "Checks your setup before syncing and shows you exactly how to fix any issues. Like having an expert review your work.",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="px-8 pt-8 pb-4">
            <Text className="text-4xl font-bold text-gray-900 mb-3">
              How SyncSimp Helps You
            </Text>
            <Text className="text-lg text-gray-600 leading-6">
              Guided setup with automated syncing - like having an expert by your side
            </Text>
          </View>

          <View className="px-8 pt-4">
            {features.map((feature, index) => (
              <View
                key={index}
                className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-start">
                  <View className="bg-blue-50 rounded-xl p-3 mr-4">
                    <feature.icon size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900 mb-2">
                      {feature.title}
                    </Text>
                    <Text className="text-base text-gray-600 leading-6">
                      {feature.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View className="px-8 pt-4">
            <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <Text className="text-center text-base text-gray-700 leading-6">
                <Text className="font-bold">Ready to save hours?</Text>
                {"\n"}
                Choose the plan that works best for you.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-6">
          <Pressable
            onPress={() => navigation.navigate("OnboardingUpgrade")}
            className="rounded-2xl p-5 shadow-lg active:scale-95"
            style={{ transform: [{ scale: 1 }] }}
          >
            <LinearGradient
              colors={["#3b82f6", "#2563eb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />
            <Text className="text-white font-bold text-lg text-center relative z-10">
              See Pricing Options →
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingFeaturesScreen;
