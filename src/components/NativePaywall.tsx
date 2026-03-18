/**
 * Custom Paywall with Apple-Required Subscription Information
 *
 * Apple requires apps with auto-renewable subscriptions to display:
 * - Title of auto-renewing subscription
 * - Length of subscription
 * - Price of subscription
 * - Functional links to Privacy Policy and Terms of Use (EULA)
 *
 * Documentation: https://developer.apple.com/app-store/review/guidelines/#in-app-purchase
 */

import React, { useEffect, useState } from "react";
import {
  Platform,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  isRevenueCatEnabled,
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasSyncSimpPro,
} from "@/lib/revenuecatClient";
import { X, Check, Crown, Star, Zap } from "lucide-react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { PACKAGE_IDENTIFIERS } from "@/lib/revenuecatProducts";
import { LinearGradient } from "expo-linear-gradient";

const LOG_PREFIX = "[NativePaywall]";

// Privacy Policy and Terms of Use - Google Docs links
const PRIVACY_POLICY_URL = "https://docs.google.com/document/d/1-rUhacC7RZH0fvQhNoDauC_nNbhAGNBhjJ8-fYf7Yv8/edit?usp=sharing";
const TERMS_OF_USE_URL = "https://docs.google.com/document/d/10P3sxn43jlNxm4REP95BF-GPrVWYtQIZ6m4vc-hQ-kM/edit?usp=sharing";

interface NativePaywallProps {
  visible: boolean;
  onDismiss: () => void;
  onPurchaseComplete?: () => void;
  onRestoreComplete?: () => void;
}

export const NativePaywall: React.FC<NativePaywallProps> = ({
  visible,
  onDismiss,
  onPurchaseComplete,
  onRestoreComplete,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [packages, setPackages] = useState<{
    monthly?: PurchasesPackage;
    yearly?: PurchasesPackage;
    lifetime?: PurchasesPackage;
  }>({});

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    if (!isRevenueCatEnabled()) {
      console.log(`${LOG_PREFIX} RevenueCat not configured`);
      setIsLoading(false);
      return;
    }

    console.log(`${LOG_PREFIX} Loading offerings...`);
    setIsLoading(true);

    const result = await getOfferings();

    if (result.ok && result.data.current) {
      const availablePackages = result.data.current.availablePackages;
      console.log(`${LOG_PREFIX} Found ${availablePackages.length} packages`);

      const packagesMap: typeof packages = {};

      for (const pkg of availablePackages) {
        console.log(
          `${LOG_PREFIX} Package: ${pkg.identifier} - ${pkg.product.title} - ${pkg.product.priceString}`
        );

        if (pkg.identifier === PACKAGE_IDENTIFIERS.MONTHLY) {
          packagesMap.monthly = pkg;
        } else if (pkg.identifier === PACKAGE_IDENTIFIERS.YEARLY) {
          packagesMap.yearly = pkg;
          // Pre-select yearly as best value
          if (!selectedPackage) {
            setSelectedPackage(pkg);
          }
        } else if (pkg.identifier === PACKAGE_IDENTIFIERS.LIFETIME) {
          packagesMap.lifetime = pkg;
        }
      }

      setPackages(packagesMap);

      // Default to monthly if no yearly
      if (!packagesMap.yearly && packagesMap.monthly && !selectedPackage) {
        setSelectedPackage(packagesMap.monthly);
      }
    } else {
      console.log(
        `${LOG_PREFIX} Failed to load offerings:`,
        result.ok ? "No current offering" : result.reason
      );
    }

    setIsLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert("Select a Plan", "Please select a subscription plan to continue.");
      return;
    }

    setIsPurchasing(true);
    console.log(`${LOG_PREFIX} Starting purchase: ${selectedPackage.identifier}`);

    const result = await purchasePackage(selectedPackage);

    if (result.ok) {
      console.log(`${LOG_PREFIX} Purchase successful!`);

      const proResult = await hasSyncSimpPro();

      if (proResult.ok && proResult.data) {
        Alert.alert(
          "Welcome to Pro!",
          "You now have access to all premium features.",
          [{ text: "Get Started", onPress: () => {
            onPurchaseComplete?.();
            onDismiss();
          }}]
        );
      } else {
        Alert.alert(
          "Purchase Complete!",
          "Your purchase was successful.",
          [{ text: "Continue", onPress: () => {
            onPurchaseComplete?.();
            onDismiss();
          }}]
        );
      }
    } else {
      console.log(`${LOG_PREFIX} Purchase failed:`, result.reason);
      if (result.reason !== "sdk_error") {
        Alert.alert("Purchase Failed", "Unable to complete the purchase. Please try again.");
      }
    }

    setIsPurchasing(false);
  };

  const handleRestore = async () => {
    console.log(`${LOG_PREFIX} Restoring purchases...`);
    setIsPurchasing(true);

    const result = await restorePurchases();

    if (result.ok) {
      const proResult = await hasSyncSimpPro();

      if (proResult.ok && proResult.data) {
        console.log(`${LOG_PREFIX} Restored Pro entitlement`);
        Alert.alert(
          "Restored!",
          "Your subscription has been restored.",
          [{ text: "Continue", onPress: () => {
            onRestoreComplete?.();
            onDismiss();
          }}]
        );
      } else {
        console.log(`${LOG_PREFIX} No active subscriptions found`);
        Alert.alert("No Purchases Found", "No previous purchases were found to restore.");
      }
    } else {
      console.log(`${LOG_PREFIX} Restore failed:`, result.reason);
      Alert.alert("Restore Failed", "Unable to restore purchases. Please try again.");
    }

    setIsPurchasing(false);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error(`${LOG_PREFIX} Failed to open URL:`, err);
      Alert.alert("Error", "Unable to open link. Please try again.");
    });
  };

  const getSubscriptionDuration = (pkg: PurchasesPackage): string => {
    if (pkg.identifier === PACKAGE_IDENTIFIERS.MONTHLY) {
      return "1 month";
    } else if (pkg.identifier === PACKAGE_IDENTIFIERS.YEARLY) {
      return "1 year";
    } else if (pkg.identifier === PACKAGE_IDENTIFIERS.LIFETIME) {
      return "Lifetime (one-time purchase)";
    }
    return pkg.product.subscriptionPeriod || "Subscription";
  };

  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Purchases Not Available on Web
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              Please use the mobile app to make purchases.
            </Text>
            <Pressable
              onPress={onDismiss}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (!isRevenueCatEnabled()) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">Upgrade</Text>
            <Pressable onPress={onDismiss} className="p-2">
              <X size={24} color="#6b7280" />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Payments Not Available
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              RevenueCat is not configured. Please set up payments in the Payments tab.
            </Text>
            <Pressable
              onPress={onDismiss}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-slate-900">
        <SafeAreaView className="flex-1" edges={["top"]}>
          {/* Close button */}
          <View className="absolute top-4 right-4 z-10">
            <Pressable
              onPress={onDismiss}
              className="bg-white/20 rounded-full p-2 active:bg-white/30"
            >
              <X size={24} color="#ffffff" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="items-center pt-12 pb-8 px-6">
              <View className="w-20 h-20 bg-amber-500 rounded-2xl items-center justify-center mb-4">
                <Crown size={40} color="#ffffff" />
              </View>
              <Text className="text-3xl font-bold text-white text-center mb-2">
                Upgrade to Pro
              </Text>
              <Text className="text-base text-slate-300 text-center">
                Unlock unlimited syncs and premium features
              </Text>
            </View>

            {/* Features */}
            <View className="px-6 mb-6">
              <View className="bg-slate-800 rounded-2xl p-4">
                {[
                  { icon: Zap, text: "Unlimited syncs to App Store Connect" },
                  { icon: Star, text: "Priority support" },
                  { icon: Check, text: "All future updates included" },
                ].map((feature, index) => (
                  <View
                    key={index}
                    className="flex-row items-center py-3 border-b border-slate-700 last:border-b-0"
                  >
                    <View className="w-8 h-8 bg-amber-500/20 rounded-full items-center justify-center mr-3">
                      <feature.icon size={16} color="#f59e0b" />
                    </View>
                    <Text className="text-white flex-1">{feature.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Loading state */}
            {isLoading && (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text className="text-slate-400 mt-3">Loading subscription options...</Text>
              </View>
            )}

            {/* Subscription Options */}
            {!isLoading && (
              <View className="px-6 mb-6">
                {/* APPLE REQUIRED: Subscription Title, Length, and Price */}

                {packages.yearly && (
                  <Pressable
                    onPress={() => setSelectedPackage(packages.yearly!)}
                    className={`rounded-2xl p-4 mb-3 border-2 ${
                      selectedPackage?.identifier === packages.yearly.identifier
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    {selectedPackage?.identifier === packages.yearly.identifier && (
                      <View className="absolute -top-3 left-4 bg-amber-500 px-3 py-1 rounded-full">
                        <Text className="text-xs font-bold text-slate-900">BEST VALUE</Text>
                      </View>
                    )}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        {/* APPLE REQUIRED: Title of subscription */}
                        <Text className="text-lg font-bold text-white mb-1">
                          {packages.yearly.product.title || "Annual Subscription"}
                        </Text>
                        {/* APPLE REQUIRED: Length of subscription */}
                        <Text className="text-slate-400 text-sm mb-1">
                          Duration: {getSubscriptionDuration(packages.yearly)}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                          Auto-renews yearly. Cancel anytime.
                        </Text>
                      </View>
                      <View className="items-end">
                        {/* APPLE REQUIRED: Price of subscription */}
                        <Text className="text-2xl font-bold text-white">
                          {packages.yearly.product.priceString}
                        </Text>
                        <Text className="text-slate-400 text-xs">/year</Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                {packages.monthly && (
                  <Pressable
                    onPress={() => setSelectedPackage(packages.monthly!)}
                    className={`rounded-2xl p-4 mb-3 border-2 ${
                      selectedPackage?.identifier === packages.monthly.identifier
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        {/* APPLE REQUIRED: Title of subscription */}
                        <Text className="text-lg font-bold text-white mb-1">
                          {packages.monthly.product.title || "Monthly Subscription"}
                        </Text>
                        {/* APPLE REQUIRED: Length of subscription */}
                        <Text className="text-slate-400 text-sm mb-1">
                          Duration: {getSubscriptionDuration(packages.monthly)}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                          Auto-renews monthly. Cancel anytime.
                        </Text>
                      </View>
                      <View className="items-end">
                        {/* APPLE REQUIRED: Price of subscription */}
                        <Text className="text-2xl font-bold text-white">
                          {packages.monthly.product.priceString}
                        </Text>
                        <Text className="text-slate-400 text-xs">/month</Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                {packages.lifetime && (
                  <Pressable
                    onPress={() => setSelectedPackage(packages.lifetime!)}
                    className={`rounded-2xl p-4 mb-3 border-2 ${
                      selectedPackage?.identifier === packages.lifetime.identifier
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        {/* APPLE REQUIRED: Title */}
                        <Text className="text-lg font-bold text-white mb-1">
                          {packages.lifetime.product.title || "Lifetime Access"}
                        </Text>
                        {/* Duration info */}
                        <Text className="text-slate-400 text-sm mb-1">
                          One-time purchase, no recurring charges
                        </Text>
                        <Text className="text-slate-500 text-xs">
                          Pay once, own forever
                        </Text>
                      </View>
                      <View className="items-end">
                        {/* APPLE REQUIRED: Price */}
                        <Text className="text-2xl font-bold text-white">
                          {packages.lifetime.product.priceString}
                        </Text>
                        <Text className="text-slate-400 text-xs">one-time</Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                {/* No packages available */}
                {!packages.monthly && !packages.yearly && !packages.lifetime && (
                  <View className="bg-slate-800 rounded-2xl p-6 items-center">
                    <Text className="text-white font-semibold mb-2">
                      No Plans Available
                    </Text>
                    <Text className="text-slate-400 text-center text-sm">
                      Subscription plans are not available at this time. Please try again later.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Purchase Button */}
            {!isLoading && selectedPackage && (
              <View className="px-6 mb-4">
                <Pressable
                  onPress={handlePurchase}
                  disabled={isPurchasing}
                  className="overflow-hidden rounded-2xl"
                >
                  <LinearGradient
                    colors={["#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      alignItems: "center",
                      opacity: isPurchasing ? 0.7 : 1,
                    }}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-lg font-bold text-white">
                        Subscribe for {selectedPackage.product.priceString}
                        {selectedPackage.identifier === PACKAGE_IDENTIFIERS.MONTHLY && "/mo"}
                        {selectedPackage.identifier === PACKAGE_IDENTIFIERS.YEARLY && "/yr"}
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* Restore Purchases */}
            <View className="px-6 mb-6">
              <Pressable
                onPress={handleRestore}
                disabled={isPurchasing}
                className="py-3 items-center"
              >
                <Text className="text-slate-400 font-medium">
                  Restore Purchases
                </Text>
              </Pressable>
            </View>

            {/* APPLE REQUIRED: Legal Links - Privacy Policy and Terms of Use */}
            <View className="px-6 mb-6">
              <View className="bg-slate-800/50 rounded-xl p-4">
                <Text className="text-slate-400 text-xs text-center mb-3">
                  {selectedPackage?.identifier === PACKAGE_IDENTIFIERS.LIFETIME
                    ? "This is a one-time purchase. No subscription required."
                    : "Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings in the App Store after purchase."}
                </Text>

                {/* APPLE REQUIRED: Functional links to Privacy Policy and Terms of Use */}
                <View className="flex-row justify-center items-center">
                  <Pressable onPress={() => openLink(PRIVACY_POLICY_URL)}>
                    <Text className="text-amber-500 text-sm font-medium underline">
                      Privacy Policy
                    </Text>
                  </Pressable>
                  <Text className="text-slate-600 mx-3">|</Text>
                  <Pressable onPress={() => openLink(TERMS_OF_USE_URL)}>
                    <Text className="text-amber-500 text-sm font-medium underline">
                      Terms of Use
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default NativePaywall;
