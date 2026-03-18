import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';

interface HelpStep {
  title: string;
  description: string;
  imagePath?: any; // require() image or null for placeholder
  imageUrl?: string; // Alternative: remote URL
}

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  steps: HelpStep[];
}

export function HelpModal({ visible, onClose, title, steps }: HelpModalProps) {
  const screenWidth = Dimensions.get('window').width;

  // Guard against undefined steps
  const safeSteps = steps ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">{title}</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 py-6">
          {safeSteps.map((step, index) => (
            <View key={index} className="mb-8">
              {/* Step Number */}
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-3">
                  <Text className="text-white font-bold">{index + 1}</Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900 flex-1">
                  {step.title}
                </Text>
              </View>

              {/* Description */}
              <Text className="text-gray-700 mb-4 leading-6">
                {step.description}
              </Text>

              {/* Screenshot */}
              {step.imagePath || step.imageUrl ? (
                <View className="bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                  <Image
                    source={step.imagePath ? step.imagePath : { uri: step.imageUrl }}
                    style={{
                      width: screenWidth - 32,
                      height: ((screenWidth - 32) * 3) / 4, // 4:3 aspect ratio
                    }}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View
                  className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center p-8"
                  style={{ height: 200 }}
                >
                  <Text className="text-gray-500 text-center">
                    📸 Screenshot coming soon
                  </Text>
                  <Text className="text-gray-400 text-sm mt-2 text-center">
                    Follow the description above for now
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View className="p-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={onClose}
            className="bg-blue-500 rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold text-base">Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
