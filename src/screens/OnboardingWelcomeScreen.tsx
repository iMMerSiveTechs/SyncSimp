import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import type { RootStackParamList } from "@/navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "OnboardingWelcome">;

const OnboardingWelcomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#1e3a8a", "#3b82f6", "#60a5fa"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
          <View className="flex-1 justify-center px-8">
            <View className="items-center mb-12">
              <View className="bg-white/20 p-6 rounded-full mb-8">
                <Sparkles size={64} color="white" />
              </View>
              <Text className="text-5xl font-bold text-white text-center mb-4">
                Welcome to{"\n"}SyncSimp
              </Text>
              <Text className="text-xl text-white/90 text-center leading-7">
                The fastest way to set up in-app purchases for your iOS apps
              </Text>
            </View>

            <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
              <Text className="text-white/90 text-base text-center leading-6">
                A step-by-step guide that walks you through setting up in-app purchases across App Store Connect and RevenueCat.
                {"\n\n"}
                Like having a helpful friend guide you through a complicated process, then automatically sync everything for you.
              </Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate("OnboardingFeatures")}
              className="bg-white rounded-2xl p-5 shadow-lg active:scale-95"
              style={{ transform: [{ scale: 1 }] }}
            >
              <Text className="text-blue-600 font-bold text-lg text-center">
                Let&apos;s Get Started →
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default OnboardingWelcomeScreen;
