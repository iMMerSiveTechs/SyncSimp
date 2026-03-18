import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Crown, Zap, RefreshCw, Sparkles, Infinity } from "lucide-react-native";
import type { RootStackParamList } from "@/navigation/types";
import { completeOnboarding } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  isRevenueCatEnabled,
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasEntitlement,
} from "@/lib/revenuecatClient";
import type { PurchasesPackage } from "react-native-purchases";

// Privacy Policy and Terms of Use - Google Docs links (keep in sync with NativePaywall.tsx)
const PRIVACY_POLICY_URL = "https://docs.google.com/document/d/1-rUhacC7RZH0fvQhNoDauC_nNbhAGNBhjJ8-fYf7Yv8/edit?usp=sharing";
const TERMS_OF_USE_URL = "https://docs.google.com/document/d/10P3sxn43jlNxm4REP95BF-GPrVWYtQIZ6m4vc-hQ-kM/edit?usp=sharing";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "OnboardingUpgrade">;

const LOG_PREFIX = "[OnboardingUpgrade]";

const OnboardingUpgradeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [packages, setPackages] = useState<{
    monthly?: PurchasesPackage;
    yearly?: PurchasesPackage;
    lifetime?: PurchasesPackage;
    perSync?: PurchasesPackage;
  }>({});

  const revenueCatEnabled = isRevenueCatEnabled();

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error(`${LOG_PREFIX} Failed to open URL:`, err);
      Alert.alert("Error", "Unable to open link. Please try again.");
    });
  };

  // Load offerings on mount
  useEffect(() => {
    const loadOfferings = async () => {
      if (!revenueCatEnabled) {
        console.log(`${LOG_PREFIX} RevenueCat not configured, skipping offerings load`);
        setIsLoadingOfferings(false);
        return;
      }

      console.log(`${LOG_PREFIX} Loading RevenueCat offerings...`);
      const result = await getOfferings();

      if (result.ok && result.data.current) {
        const availablePackages = result.data.current.availablePackages;
        console.log(`${LOG_PREFIX} Found ${availablePackages.length} packages`);

        const packagesMap: typeof packages = {};

        for (const pkg of availablePackages) {
          console.log(`${LOG_PREFIX} Package: ${pkg.identifier} - ${pkg.product.title} - ${pkg.product.priceString}`);

          if (pkg.identifier === "$rc_monthly") {
            packagesMap.monthly = pkg;
          } else if (pkg.identifier === "$rc_annual") {
            packagesMap.yearly = pkg;
          } else if (pkg.identifier === "$rc_lifetime") {
            packagesMap.lifetime = pkg;
          } else if (pkg.identifier === "$rc_custom_per_sync") {
            packagesMap.perSync = pkg;
          }
        }

        setPackages(packagesMap);
      } else {
        console.log(`${LOG_PREFIX} Failed to load offerings:`, result.ok ? "No current offering" : result.reason);
      }

      setIsLoadingOfferings(false);
    };

    loadOfferings();
  }, [revenueCatEnabled]);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const result = await completeOnboarding(userId);
      if (!result.success) {
        throw new Error(result.error || "Failed to complete onboarding");
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["session"] });
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Tabs" }],
        });
      }, 100);
    },
    onError: (error) => {
      console.log(`${LOG_PREFIX} Failed to complete onboarding:`, error);
      Alert.alert("Error", "Failed to complete onboarding. Please try again.");
    },
  });

  const handleSkipForNow = () => {
    completeOnboardingMutation.mutate();
  };

  const handleRestore = async () => {
    if (!revenueCatEnabled) {
      Alert.alert("Not Available", "Payments are not set up yet. Please use the free plan for now.");
      return;
    }

    setIsRestoring(true);
    console.log(`${LOG_PREFIX} Restoring purchases...`);

    const result = await restorePurchases();

    if (result.ok) {
      // Check if user has premium entitlement after restore
      const entitlementResult = await hasEntitlement("premium");

      if (entitlementResult.ok && entitlementResult.data) {
        console.log(`${LOG_PREFIX} Restored premium entitlement`);
        Alert.alert("Restored!", "Your purchase has been restored.", [
          { text: "Continue", onPress: () => completeOnboardingMutation.mutate() }
        ]);
      } else {
        console.log(`${LOG_PREFIX} No active purchases found`);
        Alert.alert("No Purchases Found", "No previous purchases were found to restore.");
      }
    } else {
      console.log(`${LOG_PREFIX} Restore failed:`, result.reason);
      Alert.alert("Restore Failed", "Unable to restore purchases. Please try again.");
    }

    setIsRestoring(false);
  };

  const handlePurchase = async (pkg: PurchasesPackage, productName: string) => {
    setIsPurchasing(true);
    console.log(`${LOG_PREFIX} Starting ${productName} purchase...`);

    const result = await purchasePackage(pkg);

    if (result.ok) {
      console.log(`${LOG_PREFIX} ${productName} purchase successful!`);
      Alert.alert("Purchase Complete!", `You now have access to ${productName}.`, [
        { text: "Get Started", onPress: () => completeOnboardingMutation.mutate() }
      ]);
    } else {
      console.log(`${LOG_PREFIX} ${productName} purchase failed:`, result.reason);

      if (result.reason === "sdk_error") {
        // User likely cancelled - don't show error
        console.log(`${LOG_PREFIX} Purchase cancelled or failed`);
      } else {
        Alert.alert("Purchase Failed", "Unable to complete the purchase. Please try again.");
      }
    }

    setIsPurchasing(false);
  };

  const isLoading = completeOnboardingMutation.isPending || isPurchasing || isRestoring;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="px-8 pt-8 pb-6">
            <Text className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</Text>
            <Text className="text-lg text-gray-600 leading-6">
              Select the option that works best for you. You can always upgrade later.
            </Text>
          </View>

          {isLoadingOfferings && revenueCatEnabled && (
            <View className="px-8 mb-4">
              <View className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="ml-2 text-blue-700">Loading pricing...</Text>
              </View>
            </View>
          )}

          {/* Yearly Subscription - BEST VALUE */}
          {packages.yearly && (
            <View className="px-8 mb-4">
              <View className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-purple-500">
                <View className="p-1">
                  <LinearGradient
                    colors={["#a855f7", "#7c3aed"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 16, borderRadius: 14 }}
                  >
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-row items-center">
                        <Crown size={24} color="white" />
                        <Text className="text-white text-2xl font-bold ml-2">Yearly Pro</Text>
                      </View>
                      <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white font-semibold text-xs">BEST VALUE</Text>
                      </View>
                    </View>

                    <Text className="text-white text-4xl font-bold mb-2">
                      {packages.yearly.product.priceString}
                      <Text className="text-xl font-normal">/year</Text>
                    </Text>
                    <Text className="text-white/80 text-sm mb-4">
                      Save over monthly subscription
                    </Text>

                    <View className="mt-4 space-y-2">
                      {[
                        "Unlimited app syncs",
                        "Full automation features",
                        "Priority email support",
                        "Best value - billed annually",
                      ].map((feature, index) => (
                        <View key={index} className="flex-row items-center mb-2">
                          <Check size={18} color="white" />
                          <Text className="text-white ml-2 text-base">{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => packages.yearly && handlePurchase(packages.yearly, "Yearly Pro")}
                      disabled={isLoading || isLoadingOfferings}
                      className="bg-white rounded-xl p-4 mt-6 active:scale-95"
                      style={{ transform: [{ scale: 1 }], opacity: isLoading || isLoadingOfferings ? 0.7 : 1 }}
                    >
                      {isPurchasing ? (
                        <ActivityIndicator size="small" color="#7c3aed" />
                      ) : (
                        <Text className="text-purple-600 font-bold text-lg text-center">
                          Subscribe Yearly
                        </Text>
                      )}
                    </Pressable>
                  </LinearGradient>
                </View>
              </View>
            </View>
          )}

          {/* Monthly Subscription */}
          {packages.monthly && (
            <View className="px-8 mb-4">
              <View className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-blue-500">
                <View className="p-1">
                  <LinearGradient
                    colors={["#3b82f6", "#2563eb"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 16, borderRadius: 14 }}
                  >
                    <View className="flex-row items-center mb-4">
                      <Crown size={24} color="white" />
                      <Text className="text-white text-2xl font-bold ml-2">Monthly Pro</Text>
                    </View>

                    <Text className="text-white text-4xl font-bold mb-2">
                      {packages.monthly.product.priceString}
                      <Text className="text-xl font-normal">/month</Text>
                    </Text>

                    <View className="mt-4 space-y-2">
                      {[
                        "Unlimited app syncs",
                        "Full automation features",
                        "Priority email support",
                        "Cancel anytime",
                      ].map((feature, index) => (
                        <View key={index} className="flex-row items-center mb-2">
                          <Check size={18} color="white" />
                          <Text className="text-white ml-2 text-base">{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => packages.monthly && handlePurchase(packages.monthly, "Monthly Pro")}
                      disabled={isLoading || isLoadingOfferings}
                      className="bg-white rounded-xl p-4 mt-6 active:scale-95"
                      style={{ transform: [{ scale: 1 }], opacity: isLoading || isLoadingOfferings ? 0.7 : 1 }}
                    >
                      {isPurchasing ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                      ) : (
                        <Text className="text-blue-600 font-bold text-lg text-center">
                          Subscribe Monthly
                        </Text>
                      )}
                    </Pressable>
                  </LinearGradient>
                </View>
              </View>
            </View>
          )}

          {/* Lifetime Purchase */}
          {packages.lifetime && (
            <View className="px-8 mb-4">
              <View className="bg-white rounded-2xl p-6 shadow-md border-2 border-amber-500">
                <View className="flex-row items-center mb-4">
                  <Infinity size={24} color="#f59e0b" />
                  <Text className="text-gray-900 text-2xl font-bold ml-2">Lifetime Access</Text>
                </View>

                <Text className="text-gray-900 text-4xl font-bold mb-2">
                  {packages.lifetime.product.priceString}
                  <Text className="text-xl font-normal text-gray-600"> once</Text>
                </Text>
                <Text className="text-gray-600 text-base mb-6">
                  Pay once, use forever. No recurring charges.
                </Text>

                <View className="mb-4">
                  {[
                    "Unlimited app syncs forever",
                    "All future updates included",
                    "One-time payment",
                    "Best long-term value",
                  ].map((feature, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <Check size={18} color="#f59e0b" />
                      <Text className="text-gray-700 ml-2 text-base">{feature}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => packages.lifetime && handlePurchase(packages.lifetime, "Lifetime Access")}
                  disabled={isLoading || isLoadingOfferings}
                  className="bg-amber-500 rounded-xl p-4 active:scale-95"
                  style={{ transform: [{ scale: 1 }], opacity: isLoading || isLoadingOfferings ? 0.7 : 1 }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg text-center">
                      Buy Lifetime Access
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Per Sync Purchase */}
          {packages.perSync && (
            <View className="px-8 mb-4">
              <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                <View className="flex-row items-center mb-4">
                  <Zap size={24} color="#3b82f6" />
                  <Text className="text-gray-900 text-2xl font-bold ml-2">Pay-Per-Sync</Text>
                </View>

                <Text className="text-gray-900 text-4xl font-bold mb-2">
                  {packages.perSync.product.priceString}
                  <Text className="text-xl font-normal text-gray-600">/sync</Text>
                </Text>
                <Text className="text-gray-600 text-base mb-6">
                  No subscription required. Pay only when you need it.
                </Text>

                <Pressable
                  onPress={() => {
                    if (packages.perSync) {
                      handlePurchase(packages.perSync, "Per Sync");
                    }
                  }}
                  disabled={isLoading || isLoadingOfferings}
                  className="bg-blue-500 rounded-xl p-4 active:scale-95"
                  style={{ transform: [{ scale: 1 }], opacity: isLoading || isLoadingOfferings ? 0.7 : 1 }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg text-center">
                      Purchase 1 Sync
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Free Plan */}
          <View className="px-8 mb-4">
            <View className="bg-gray-100 rounded-2xl p-6 border border-gray-300">
              <Text className="text-gray-900 text-2xl font-bold mb-2">Free Plan</Text>
              <Text className="text-gray-900 text-4xl font-bold mb-2">
                $0<Text className="text-xl font-normal text-gray-600">/month</Text>
              </Text>
              <Text className="text-gray-600 text-base mb-4">1 free sync per month</Text>

              <View className="space-y-2 mb-4">
                {["1 free sync/month (verified account)", "Full automation features", "Email support"].map(
                  (feature, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <Check size={18} color="#6b7280" />
                      <Text className="text-gray-700 ml-2 text-base">{feature}</Text>
                    </View>
                  )
                )}
              </View>

              <Pressable
                onPress={handleSkipForNow}
                disabled={isLoading}
                className="bg-gray-700 rounded-xl p-4 active:scale-95"
                style={{ transform: [{ scale: 1 }], opacity: isLoading ? 0.7 : 1 }}
              >
                <Text className="text-white font-bold text-lg text-center">
                  {completeOnboardingMutation.isPending ? "Loading..." : "Continue with Free"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Restore Purchases */}
          {revenueCatEnabled && (
            <View className="px-8 mb-4">
              <Pressable
                onPress={handleRestore}
                disabled={isLoading}
                className="flex-row items-center justify-center py-3"
              >
                {isRestoring ? (
                  <ActivityIndicator size="small" color="#6b7280" />
                ) : (
                  <>
                    <RefreshCw size={16} color="#6b7280" />
                    <Text className="text-gray-500 ml-2 text-base">Restore Previous Purchases</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* APPLE REQUIRED: Legal Links - Privacy Policy and Terms of Use */}
          <View className="px-8 mb-8">
            <View className="bg-gray-100 rounded-xl p-4">
              <Text className="text-gray-500 text-xs text-center mb-3">
                Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. You can manage and cancel your subscriptions in your App Store account settings.
              </Text>
              <View className="flex-row justify-center items-center">
                <Pressable onPress={() => openLink(PRIVACY_POLICY_URL)}>
                  <Text className="text-blue-500 text-sm font-medium underline">
                    Privacy Policy
                  </Text>
                </Pressable>
                <Text className="text-gray-400 mx-3">|</Text>
                <Pressable onPress={() => openLink(TERMS_OF_USE_URL)}>
                  <Text className="text-blue-500 text-sm font-medium underline">
                    Terms of Use
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingUpgradeScreen;
