import React from "react";
import { View, Text, ScrollView } from "react-native";
import { AlertCircle, Video as VideoIcon, Film } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"VideoTool">;

// Apple's required app preview video sizes (as of 2024)
// Simplified - Apple now auto-scales from one size per device category
const REQUIRED_SIZES = [
  { name: "iPhone 6.9\" - 6.1\"", width: 886, height: 1920, desc: "iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max and newer iPhones", landscape: { width: 1920, height: 886 } },
  { name: "iPhone 5.5\"", width: 1080, height: 1920, desc: "iPhone 8 Plus, 7 Plus, 6s Plus", landscape: { width: 1920, height: 1080 } },
  { name: "iPhone 4.7\"", width: 750, height: 1334, desc: "iPhone 8, 7, 6s", landscape: { width: 1334, height: 750 } },
  { name: "iPad 13\" - 10.5\"", width: 1200, height: 1600, desc: "iPad Pro 12.9-inch, 11-inch, 10.5-inch", landscape: { width: 1600, height: 1200 } },
  { name: "iPad 9.7\"", width: 900, height: 1200, desc: "iPad 9.7-inch and older", landscape: { width: 1200, height: 900 } },
];

const VideoToolScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="bg-amber-50 rounded-xl p-4 mb-4 flex-row items-start">
          <AlertCircle size={20} color="#f59e0b" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-amber-900 font-semibold mb-1">Video Specifications Reference</Text>
            <Text className="text-amber-800 text-sm">
              This tool shows you the required video dimensions and specs for App Store app preview videos. Use desktop tools like FFmpeg, iMovie, or HandBrake to create videos with these specifications.
            </Text>
          </View>
        </View>

        {/* Required Sizes List */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="font-bold text-lg mb-3">Required Video Dimensions</Text>
          {REQUIRED_SIZES.map((size, index) => (
            <View key={index} className="mb-4 pb-4 border-b border-slate-100 last:border-b-0">
              <Text className="font-semibold text-slate-900 mb-1">{size.name}</Text>
              <Text className="text-sm text-slate-700 font-medium">Portrait: {size.width} × {size.height}px</Text>
              <Text className="text-sm text-slate-700 font-medium mb-1">Landscape: {size.landscape.width} × {size.landscape.height}px</Text>
              <Text className="text-xs text-slate-500">{size.desc}</Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="font-bold text-lg mb-3">How to Create App Preview Videos</Text>
          <View className="space-y-2">
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">Record your app running on an iOS device or simulator (15-30 seconds)</Text>
              </View>
            </View>
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">
                  Use FFmpeg, iMovie, or HandBrake to resize videos to the required dimensions above
                </Text>
              </View>
            </View>
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">
                  Export as .mov or .mp4 with H.264 codec and AAC audio
                </Text>
              </View>
            </View>
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">4</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">
                  Upload to App Store Connect (max 500MB per video)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FFmpeg Example */}
        <View className="bg-slate-900 rounded-xl p-4 mb-4">
          <Text className="font-bold text-base mb-2 text-white">FFmpeg Example Command</Text>
          <Text className="text-slate-300 text-xs font-mono mb-2">
            # Resize to iPhone 6.9&quot; portrait
          </Text>
          <Text className="text-green-300 text-xs font-mono">
            ffmpeg -i input.mp4 -vf &quot;scale=886:1920:force_original_aspect_ratio=decrease,pad=886:1920:(ow-iw)/2:(oh-ih)/2&quot; -c:v libx264 -c:a aac -b:a 128k output.mov
          </Text>
        </View>

        <View className="bg-green-50 rounded-xl p-4 mb-4 flex-row items-start">
          <VideoIcon size={20} color="#10b981" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-green-900 font-semibold mb-1">Pro Tip</Text>
            <Text className="text-green-800 text-sm">
              Record your app directly on the target device size in iOS Simulator to avoid resizing. Use QuickTime Player&#39;s screen recording feature on macOS.
            </Text>
          </View>
        </View>

        <View className="bg-blue-50 rounded-xl p-4 mb-4 flex-row items-start">
          <AlertCircle size={20} color="#3b82f6" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-blue-900 font-semibold mb-1">Technical Requirements</Text>
            <Text className="text-blue-800 text-sm mb-1">• Duration: 15-30 seconds</Text>
            <Text className="text-blue-800 text-sm mb-1">• Format: .mov, .mp4, or .m4v</Text>
            <Text className="text-blue-800 text-sm mb-1">• Codec: H.264 video, AAC audio</Text>
            <Text className="text-blue-800 text-sm mb-1">• File size: Max 500MB per video</Text>
            <Text className="text-blue-800 text-sm">• Limit: Up to 3 videos per localization</Text>
          </View>
        </View>

        <View className="bg-purple-50 rounded-xl p-4 flex-row items-start">
          <Film size={20} color="#9333ea" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-purple-900 font-semibold mb-1">Why No Automatic Resizing?</Text>
            <Text className="text-purple-800 text-sm">
              Unlike images, video processing requires native code (FFmpeg) which isn&#39;t available in this environment. Use the desktop tools listed above to resize your videos before uploading to App Store Connect.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default VideoToolScreen;
