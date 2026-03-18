import React from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { X, AlertCircle, Clock, HelpCircle } from "lucide-react-native";
import type { ErrorFix } from "@/constants/errorFixes";

interface ErrorFixModalProps {
  visible: boolean;
  onClose: () => void;
  errorFix: ErrorFix;
}

const ErrorFixModal = ({ visible, onClose, errorFix }: ErrorFixModalProps) => {
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="bg-white border-b border-slate-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-bold text-slate-900">
                How to Fix This
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center bg-slate-100 rounded-full"
            >
              <X size={20} color="#475569" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1">
          {/* Error Title */}
          <View className="bg-red-50 border-b border-red-100 p-4">
            <View className="flex-row items-start">
              <AlertCircle size={24} color="#dc2626" className="mt-0.5" />
              <View className="flex-1 ml-3">
                <Text className="text-red-900 font-bold text-lg mb-1">
                  {errorFix.title}
                </Text>
                <Text className="text-red-800 text-sm leading-5">
                  {errorFix.description}
                </Text>
              </View>
            </View>

            {/* Estimated time */}
            {errorFix.estimatedTime && (
              <View className="flex-row items-center mt-3 bg-white/60 rounded-lg px-3 py-2">
                <Clock size={16} color="#dc2626" />
                <Text className="text-red-900 text-sm ml-2 font-medium">
                  Estimated time: {errorFix.estimatedTime}
                </Text>
              </View>
            )}
          </View>

          {/* Step-by-step instructions */}
          <View className="p-4">
            <Text className="text-slate-900 font-bold text-base mb-3">
              Step-by-Step Fix:
            </Text>

            {errorFix.steps.map((step, index) => (
              <View
                key={index}
                className="bg-white rounded-xl p-4 mb-3 border border-slate-200"
              >
                {/* Step number and title */}
                <View className="flex-row items-start mb-2">
                  <View className="w-7 h-7 bg-blue-600 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold text-sm">
                      {step.number}
                    </Text>
                  </View>
                  <Text className="flex-1 text-slate-900 font-semibold text-base leading-6">
                    {step.instruction}
                  </Text>
                </View>

                {/* Detailed explanation */}
                {step.details && (
                  <View className="ml-10">
                    <Text className="text-slate-600 text-sm leading-5">
                      {step.details}
                    </Text>
                  </View>
                )}

                {/* Screenshot placeholder */}
                {step.screenshot && (
                  <View className="ml-10 mt-3 bg-slate-100 rounded-lg p-3 border border-slate-200">
                    <Text className="text-slate-500 text-xs">
                      📷 Screenshot: {step.screenshot}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Common mistakes */}
          {errorFix.commonMistakes && errorFix.commonMistakes.length > 0 && (
            <View className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <AlertCircle size={18} color="#d97706" />
                <Text className="text-amber-900 font-bold text-sm ml-2">
                  Common Mistakes to Avoid:
                </Text>
              </View>
              {errorFix.commonMistakes.map((mistake, index) => (
                <View key={index} className="flex-row items-start mt-2">
                  <Text className="text-amber-900 mr-2">•</Text>
                  <Text className="flex-1 text-amber-800 text-sm leading-5">
                    {mistake}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Need help section */}
          {errorFix.needsHelp && (
            <View className="mx-4 mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <View className="flex-row items-start">
                <HelpCircle size={18} color="#2563eb" className="mt-0.5" />
                <View className="flex-1 ml-2">
                  <Text className="text-blue-900 font-bold text-sm mb-1">
                    Still Need Help?
                  </Text>
                  <Text className="text-blue-800 text-sm leading-5">
                    {errorFix.needsHelp}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Close button */}
        <View className="bg-white border-t border-slate-200 p-4">
          <Pressable
            onPress={onClose}
            className="bg-blue-600 rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold text-base">
              Got It, Let Me Fix This
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default ErrorFixModal;
