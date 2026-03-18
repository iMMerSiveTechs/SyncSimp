import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Download, Upload, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";

type Props = RootStackScreenProps<"ScreenshotTool">;

// Apple's required screenshot sizes (as of 2024)
const IPHONE_SIZES = [
  { name: "iPhone 6.7\"", width: 1290, height: 2796, desc: "iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max, 12 Pro Max" },
  { name: "iPhone 6.5\"", width: 1242, height: 2688, desc: "iPhone 11 Pro Max, XS Max" },
  { name: "iPhone 5.5\"", width: 1242, height: 2208, desc: "iPhone 8 Plus, 7 Plus, 6s Plus" },
  { name: "Square 1024x1024", width: 1024, height: 1024, desc: "Subscription Review Info, App Icon" },
];

const IPAD_SIZES = [
  { name: "iPad Pro 13\" (Portrait)", width: 2064, height: 2752, desc: "iPad Pro 13-inch Display" },
  { name: "iPad Pro 13\" (Landscape)", width: 2752, height: 2064, desc: "iPad Pro 13-inch Display" },
  { name: "iPad Pro 12.9\" (Portrait)", width: 2048, height: 2732, desc: "iPad Pro 12.9-inch Display" },
  { name: "iPad Pro 12.9\" (Landscape)", width: 2732, height: 2048, desc: "iPad Pro 12.9-inch Display" },
];

const REQUIRED_SIZES = [...IPHONE_SIZES, ...IPAD_SIZES];

const ScreenshotToolScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  const toggleSize = (sizeName: string) => {
    setSelectedSizes(prev =>
      prev.includes(sizeName)
        ? prev.filter(s => s !== sizeName)
        : [...prev, sizeName]
    );
  };

  const selectAllSizes = () => {
    setSelectedSizes(REQUIRED_SIZES.map(s => s.name));
  };

  const deselectAllSizes = () => {
    setSelectedSizes([]);
  };

  const pickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to select screenshots.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        if (result.assets.length > 10) {
          Alert.alert("Too Many Images", "Please select up to 10 screenshots. App Store Connect allows a maximum of 10 screenshots per device size.");
          return;
        }
        setSelectedImages(result.assets.map(asset => asset.uri));
        setProcessedCount(0);
      }
    } catch (error: any) {
      console.log("[ScreenshotTool] Error picking images:", error?.message);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };

  const resizeAndExport = async () => {
    if (selectedImages.length === 0) return;
    if (selectedSizes.length === 0) {
      Alert.alert("No Sizes Selected", "Please select at least one device size to create.");
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    const total = selectedImages.length * selectedSizes.length;
    setTotalToProcess(total);

    try {
      const exportDir = `${FileSystem.cacheDirectory}screenshots_${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });

      const resizedUris: string[] = [];
      let processed = 0;

      // Get only the selected sizes
      const sizesToProcess = REQUIRED_SIZES.filter(size => selectedSizes.includes(size.name));

      // Process each selected image
      for (let imgIndex = 0; imgIndex < selectedImages.length; imgIndex++) {
        const imageUri = selectedImages[imgIndex];

        // Resize to each selected size
        for (const size of sizesToProcess) {
          try {
            // Resize image to fit within the required dimensions while maintaining aspect ratio
            const resized = await ImageManipulator.manipulateAsync(
              imageUri,
              [
                {
                  resize: {
                    width: size.width,
                    height: size.height,
                  },
                },
              ],
              { compress: 1, format: ImageManipulator.SaveFormat.PNG }
            );

            // Save to cache directory with descriptive name
            const fileName = `screenshot_${imgIndex + 1}_${size.name.replace(/[^a-zA-Z0-9]/g, "_")}_${size.width}x${size.height}.png`;
            const destination = `${exportDir}${fileName}`;
            await FileSystem.moveAsync({
              from: resized.uri,
              to: destination,
            });

            resizedUris.push(destination);
            processed++;
            setProcessedCount(processed);
          } catch (error: any) {
            console.log(`[ScreenshotTool] Error processing image ${imgIndex + 1} for ${size.name}:`, error?.message);
          }
        }
      }

      if (resizedUris.length === 0) {
        Alert.alert("Error", "Failed to process any screenshots. Please try a different image.");
        return;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Success!",
          `Processed ${resizedUris.length} screenshots. They are saved in the app cache directory.`
        );
        return;
      }

      // Share all files one by one (iOS limitation - can't share multiple files at once)
      Alert.alert(
        "Export Screenshots",
        `Successfully created ${resizedUris.length} screenshots in all required sizes. Tap Export to save each one to your Files app.`,
        [
          {
            text: "Export All",
            onPress: async () => {
              // Share each file sequentially
              for (let i = 0; i < resizedUris.length; i++) {
                try {
                  await Sharing.shareAsync(resizedUris[i], {
                    mimeType: "image/png",
                    dialogTitle: `Save Screenshot ${i + 1}/${resizedUris.length}`,
                    UTI: "public.png",
                  });
                } catch (error: any) {
                  console.log(`[ScreenshotTool] Error sharing file ${i + 1}:`, error?.message);
                }
              }
              Alert.alert("Complete!", `All ${resizedUris.length} screenshots have been exported. You can now upload them to App Store Connect.`);
            },
          },
          { text: "Done", style: "cancel" },
        ]
      );
    } catch (error: any) {
      console.log("[ScreenshotTool] Error in resizeAndExport:", error?.message);
      Alert.alert("Error", "Failed to process screenshots. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="bg-blue-50 rounded-xl p-4 mb-4 flex-row items-start">
          <AlertCircle size={20} color="#3b82f6" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-blue-900 font-semibold mb-1">Screenshot Requirements</Text>
            <Text className="text-blue-800 text-sm">
              Apple requires screenshots in specific sizes for different devices. Upload your screenshot and we&apos;ll automatically create all required sizes.
            </Text>
          </View>
        </View>

        {/* Required Sizes List */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-lg">Select Sizes to Create</Text>
            <View className="flex-row gap-2">
              <Pressable onPress={selectAllSizes} className="px-3 py-1.5 bg-blue-100 rounded-lg">
                <Text className="text-blue-700 font-medium text-xs">Select All</Text>
              </Pressable>
              <Pressable onPress={deselectAllSizes} className="px-3 py-1.5 bg-slate-100 rounded-lg">
                <Text className="text-slate-700 font-medium text-xs">Clear</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-slate-600 text-sm mb-3">
            Selected: {selectedSizes.length} of {REQUIRED_SIZES.length} sizes
          </Text>

          {/* iPhone Sizes */}
          <Text className="font-semibold text-slate-700 mb-2 text-sm">iPhone</Text>
          {IPHONE_SIZES.map((size, index) => (
            <Pressable
              key={`iphone-${index}`}
              onPress={() => toggleSize(size.name)}
              className="mb-3 pb-3 border-b border-slate-100 flex-row items-start"
            >
              <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                selectedSizes.includes(size.name) ? "bg-blue-600 border-blue-600" : "border-slate-300"
              }`}>
                {selectedSizes.includes(size.name) && (
                  <CheckCircle2 size={14} color="#ffffff" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">{size.name}</Text>
                <Text className="text-sm text-slate-600">{size.width} × {size.height}px</Text>
                <Text className="text-xs text-slate-500 mt-1">{size.desc}</Text>
              </View>
            </Pressable>
          ))}

          {/* iPad Sizes */}
          <Text className="font-semibold text-slate-700 mb-2 mt-2 text-sm">iPad</Text>
          {IPAD_SIZES.map((size, index) => (
            <Pressable
              key={`ipad-${index}`}
              onPress={() => toggleSize(size.name)}
              className={`mb-3 pb-3 border-b border-slate-100 flex-row items-start ${
                index === IPAD_SIZES.length - 1 ? "border-b-0" : ""
              }`}
            >
              <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                selectedSizes.includes(size.name) ? "bg-blue-600 border-blue-600" : "border-slate-300"
              }`}>
                {selectedSizes.includes(size.name) && (
                  <CheckCircle2 size={14} color="#ffffff" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">{size.name}</Text>
                <Text className="text-sm text-slate-600">{size.width} × {size.height}px</Text>
                <Text className="text-xs text-slate-500 mt-1">{size.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <Text className="font-bold text-lg mb-3">Selected Screenshots ({selectedImages.length}/10)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="w-24 h-40 rounded-lg mr-2"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upload Button */}
        {selectedImages.length === 0 && (
          <Pressable
            onPress={pickImages}
            className="bg-blue-600 rounded-xl p-6 mb-4 items-center"
          >
            <Upload size={32} color="#ffffff" />
            <Text className="text-white font-semibold text-lg mt-2">Select Screenshots</Text>
            <Text className="text-blue-100 text-sm mt-1">
              Choose up to 10 screenshots from your photo library
            </Text>
          </Pressable>
        )}

        {/* Processing Status */}
        {selectedImages.length > 0 && (
          <View className="mb-4">
            {processedCount > 0 && processedCount < totalToProcess && (
              <View className="bg-amber-50 rounded-xl p-4 mb-4 flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-amber-400 animate-pulse" />
                <Text className="ml-3 text-amber-900 font-medium">
                  Processing: {processedCount}/{totalToProcess} screenshots
                </Text>
              </View>
            )}

            {processedCount === totalToProcess && totalToProcess > 0 && (
              <View className="bg-green-50 rounded-xl p-4 mb-4 flex-row items-center">
                <CheckCircle2 size={24} color="#10b981" />
                <Text className="ml-3 text-green-900 font-semibold">
                  All {totalToProcess} screenshots created!
                </Text>
              </View>
            )}

            <Pressable
              onPress={resizeAndExport}
              disabled={isProcessing || selectedSizes.length === 0}
              className={`rounded-xl p-4 items-center flex-row justify-center ${
                isProcessing || selectedSizes.length === 0 ? "bg-slate-400" : "bg-green-600"
              }`}
            >
              <Download size={20} color="#ffffff" />
              <Text className="text-white font-semibold text-lg ml-2">
                {isProcessing ? "Processing..." : `Create ${selectedSizes.length} Size${selectedSizes.length !== 1 ? 's' : ''}`}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedImages([])}
              className="mt-3 rounded-xl p-4 items-center bg-slate-200"
            >
              <Text className="text-slate-700 font-medium">Choose Different Images</Text>
            </Pressable>
          </View>
        )}

        {/* Instructions */}
        <View className="bg-white rounded-xl p-4">
          <Text className="font-bold text-lg mb-3">How It Works</Text>
          <View className="space-y-2">
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">Select up to 10 high-resolution screenshots from your device</Text>
              </View>
            </View>
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">
                  Choose which device sizes you need - select specific sizes or tap &quot;Select All&quot;
                </Text>
              </View>
            </View>
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">
                  Tap the green button - each screenshot will be resized to your selected sizes
                </Text>
              </View>
            </View>
            <View className="flex-row mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">4</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-800">
                  Export all screenshots and manually upload them to App Store Connect
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-blue-50 rounded-xl p-4 mt-4 flex-row items-start">
          <AlertCircle size={20} color="#3b82f6" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-blue-900 font-semibold mb-1">App Store Requirements</Text>
            <Text className="text-blue-800 text-sm mb-2">
              App Store Connect requires up to 10 screenshots per device size. Choose only the sizes you need - no need to create all {REQUIRED_SIZES.length} if you don&apos;t need them all.
            </Text>
            <Text className="text-blue-800 text-sm font-medium">
              Example: Select 3 screenshots + 2 sizes → Get 6 total files (3 × 2)
            </Text>
          </View>
        </View>

        <View className="bg-amber-50 rounded-xl p-4 mt-4 flex-row items-start">
          <ImageIcon size={20} color="#f59e0b" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-amber-900 font-semibold mb-1">Pro Tip</Text>
            <Text className="text-amber-800 text-sm">
              Use screenshots from the largest device (like iPhone 15 Pro Max) for best quality. The tool will resize them to fit all required dimensions while maintaining quality.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ScreenshotToolScreen;
