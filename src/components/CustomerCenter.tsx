/**
 * RevenueCat Customer Center Component
 *
 * Allows users to manage their subscriptions, view purchase history,
 * request refunds (iOS only), and access support options
 *
 * Documentation: https://www.revenuecat.com/docs/tools/customer-center
 */

import React from "react";
import { View, Text, Modal, Platform, Pressable } from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import type { CustomerInfo, PurchasesError, REFUND_REQUEST_STATUS } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";
import { isRevenueCatEnabled } from "@/lib/revenuecatClient";
import { X } from "lucide-react-native";

const LOG_PREFIX = "[CustomerCenter]";

interface CustomerCenterProps {
  visible: boolean;
  onDismiss: () => void;
  shouldShowCloseButton?: boolean;
}

export const CustomerCenter: React.FC<CustomerCenterProps> = ({
  visible,
  onDismiss,
  shouldShowCloseButton = true,
}) => {
  if (Platform.OS === "web") {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Customer Center Not Available on Web
            </Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              Please use the mobile app to manage your subscriptions.
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
            <Text className="text-lg font-semibold text-gray-900">
              Manage Subscriptions
            </Text>
            <Pressable onPress={onDismiss} className="p-2">
              <X size={24} color="#6b7280" />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Customer Center Not Available
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
      <SafeAreaView className="flex-1 bg-white">
        {/* Close button (only shown if shouldShowCloseButton is true) */}
        {shouldShowCloseButton && (
          <View className="absolute top-0 right-0 z-10 p-4">
            <Pressable
              onPress={onDismiss}
              className="bg-gray-100 rounded-full p-2 active:bg-gray-200"
            >
              <X size={24} color="#374151" />
            </Pressable>
          </View>
        )}

        {/* RevenueCat Customer Center UI */}
        <RevenueCatUI.CustomerCenterView
          style={{ flex: 1 }}
          shouldShowCloseButton={shouldShowCloseButton}
          onDismiss={() => {
            console.log(`${LOG_PREFIX} Customer Center dismissed`);
            onDismiss();
          }}
          onRestoreStarted={() => {
            console.log(`${LOG_PREFIX} Restore started`);
          }}
          onRestoreCompleted={({ customerInfo }: { customerInfo: CustomerInfo }) => {
            console.log(`${LOG_PREFIX} Restore completed`, customerInfo);
          }}
          onRestoreFailed={({ error }: { error: PurchasesError }) => {
            console.log(`${LOG_PREFIX} Restore failed:`, error);
          }}
          onRefundRequestStarted={({ productIdentifier }: { productIdentifier: string }) => {
            console.log(`${LOG_PREFIX} Refund request started for:`, productIdentifier);
          }}
          onRefundRequestCompleted={({
            productIdentifier,
            refundRequestStatus,
          }: {
            productIdentifier: string;
            refundRequestStatus: REFUND_REQUEST_STATUS;
          }) => {
            console.log(
              `${LOG_PREFIX} Refund request completed for ${productIdentifier}:`,
              refundRequestStatus
            );
          }}
          onFeedbackSurveyCompleted={({
            feedbackSurveyOptionId,
          }: {
            feedbackSurveyOptionId: string;
          }) => {
            console.log(`${LOG_PREFIX} Feedback survey completed:`, feedbackSurveyOptionId);
          }}
          onShowingManageSubscriptions={() => {
            console.log(`${LOG_PREFIX} Showing manage subscriptions`);
          }}
          onManagementOptionSelected={(event) => {
            console.log(`${LOG_PREFIX} Management option selected:`, event);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

/**
 * Present Customer Center modally using RevenueCat's native presentation
 *
 * This is an alternative to using the CustomerCenter component above.
 * It presents the Customer Center using RevenueCat's native modal presentation.
 */
export const presentCustomerCenter = async () => {
  if (Platform.OS === "web") {
    console.log(`${LOG_PREFIX} Customer Center not available on web`);
    return;
  }

  if (!isRevenueCatEnabled()) {
    console.log(`${LOG_PREFIX} RevenueCat not configured`);
    return;
  }

  try {
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreStarted: () => {
          console.log(`${LOG_PREFIX} Restore started`);
        },
        onRestoreCompleted: ({ customerInfo }: { customerInfo: CustomerInfo }) => {
          console.log(`${LOG_PREFIX} Restore completed`, customerInfo);
        },
        onRestoreFailed: ({ error }: { error: PurchasesError }) => {
          console.log(`${LOG_PREFIX} Restore failed:`, error);
        },
        onRefundRequestStarted: ({ productIdentifier }: { productIdentifier: string }) => {
          console.log(`${LOG_PREFIX} Refund request started for:`, productIdentifier);
        },
        onRefundRequestCompleted: ({
          productIdentifier,
          refundRequestStatus,
        }: {
          productIdentifier: string;
          refundRequestStatus: REFUND_REQUEST_STATUS;
        }) => {
          console.log(
            `${LOG_PREFIX} Refund request completed for ${productIdentifier}:`,
            refundRequestStatus
          );
        },
        onFeedbackSurveyCompleted: ({
          feedbackSurveyOptionId,
        }: {
          feedbackSurveyOptionId: string;
        }) => {
          console.log(`${LOG_PREFIX} Feedback survey completed:`, feedbackSurveyOptionId);
        },
      },
    });
  } catch (error) {
    console.log(`${LOG_PREFIX} Failed to present Customer Center:`, error);
  }
};

export default CustomerCenter;
