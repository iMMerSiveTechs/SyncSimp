import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Plus, Trash2, HelpCircle, Check } from "lucide-react-native";
import type { RootStackScreenProps } from "@/navigation/types";
import { getProject, updateProject, type Project } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as yaml from "js-yaml";
import { HelpModal } from "@/components/HelpModal";

type Props = RootStackScreenProps<"ConfigWizard">;

type ProductType = "auto_renewable" | "non_consumable" | "consumable";

type Product = {
  id: string;
  name: string;
  productId: string;
  price: string;
  type: ProductType;
  duration: string; // Only used for auto_renewable
  trialDays: string; // Only used for auto_renewable
};

const ConfigWizardScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [revenueCatProjectId, setRevenueCatProjectId] = useState("");
  const [revenueCatAppId, setRevenueCatAppId] = useState("");
  const [showRevenueCatHelp, setShowRevenueCatHelp] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValuesRef = useRef<string>("");
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Monthly Subscription",
      productId: "",
      price: "9.99",
      type: "auto_renewable",
      duration: "P1M",
      trialDays: "7",
    },
  ]);

  // Fetch project from Firebase
  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project", projectId, userId],
    queryFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const project = await getProject(projectId, userId);
      return project;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - allow refresh on navigation
  });

  // Generate YAML configuration
  const generateYAML = (currentProjectData: Project | null | undefined) => {
    if (!currentProjectData) return "";

    const bundleId = currentProjectData.bundleId;

    const config = {
      version: 1,
      app: {
        name: currentProjectData.name,
        bundleId: bundleId,
        platform: "ios",
      },
      apple: {
        subscriptionGroup: {
          id: `${bundleId.replace(/\./g, "_")}_subscription_group`,
          referenceName: `${currentProjectData.name} Subscriptions`,
        },
        locales: [
          {
            id: "en-US",
            name: "English Name",
            description: "English Description",
          },
        ],
      },
      revenuecat: {
        projectId: revenueCatProjectId || "your_project_id",
        iosAppId: revenueCatAppId || "your_ios_app_id",
      },
      entitlements: [
        {
          id: "premium",
          displayName: "Premium Access",
          description: "Access to all premium features",
        },
      ],
      offerings: [
        {
          id: "default",
          displayName: "Default Offering",
          description: "Main offering",
          primary: true,
        },
      ],
      plans: products.map((product, index) => {
        // Clean product name for Apple: only alphanumeric, underscores, and periods allowed
        const cleanName = product.name
          .toLowerCase()
          .replace(/\s+/g, "_")           // spaces to underscores
          .replace(/[^a-z0-9_.]/g, "");   // remove any other invalid chars

        const productId = product.productId || `${bundleId}.${cleanName}`;
        const isSubscription = product.type === "auto_renewable";

        return {
          id: product.productId || `product_${index}`,
          planId: product.productId || `product_${index}`,
          displayName: product.name || `Product ${index + 1}`,
          type: product.type || "auto_renewable",
          appleProductId: productId,
          entitlement: "premium",
          // Only include duration for subscriptions
          ...(isSubscription ? { duration: product.duration || "P1M" } : {}),
          price: {
            currency: "USD",
            amount: parseFloat(product.price) || 9.99,
          },
          // Only include introOffer for subscriptions
          ...(isSubscription && product.trialDays
            ? {
                introOffer: {
                  type: "free_trial",
                  duration: `P${product.trialDays}D`,
                },
              }
            : {}),
          rc: {
            offering: "default",
            packageId: product.productId || `package_${index}`,
          },
        };
      }),
    };

    return yaml.dump(config);
  };

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (values: { configYaml: string; revenueCatProjectId: string; revenueCatIosAppId: string }) => {
      if (!userId) throw new Error("Not logged in");

      console.log("[ConfigWizard] Auto-saving configuration...");

      const result = await updateProject(projectId, userId, {
        configYaml: values.configYaml || null,
        revenueCatProjectId: values.revenueCatProjectId || null,
        revenueCatIosAppId: values.revenueCatIosAppId || null,
      } as Partial<Project>);

      if (!result.success) {
        throw new Error(result.error || "Failed to save");
      }
      return result;
    },
    onSuccess: () => {
      setSaveStatus('saved');
      console.log("[ConfigWizard] ✅ Auto-save successful");
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: (error: any) => {
      setSaveStatus('idle');
      console.log("[ConfigWizard] ⚠️ Auto-save failed:", error?.message || "Unknown error");
    },
  });

  // Manual save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");

      const configYaml = generateYAML(projectData);

      console.log("[ConfigWizard] Manual save initiated");

      const result = await updateProject(projectId, userId, {
        configYaml: configYaml || null,
        revenueCatProjectId: revenueCatProjectId.trim() || null,
        revenueCatIosAppId: revenueCatAppId.trim() || null,
      } as Partial<Project>);

      if (!result.success) {
        throw new Error(result.error || "Failed to save");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      console.log("[ConfigWizard] ✅ Manual save successful!");
      Alert.alert("Success", "Configuration saved successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      console.log("[ConfigWizard] ✗ MANUAL SAVE FAILED:", error?.message || "Unknown error");
      Alert.alert("Error", error?.message || "Failed to save configuration");
    },
  });

  // Load existing data when fetched (ONLY ONCE)
  useEffect(() => {
    if (projectData && !hasLoadedInitialData) {
      // Pre-fill RevenueCat IDs and products if they exist
      if (projectData.configYaml) {
        try {
          const config: any = yaml.load(projectData.configYaml);
          if (config.revenuecat?.projectId) {
            setRevenueCatProjectId(config.revenuecat.projectId);
          }
          if (config.revenuecat?.iosAppId) {
            setRevenueCatAppId(config.revenuecat.iosAppId);
          }
          // Load products from YAML
          if (config.plans && Array.isArray(config.plans) && config.plans.length > 0) {
            const loadedProducts: Product[] = config.plans.map((plan: any, index: number) => ({
              id: plan.id || `loaded_${index}`,
              name: plan.displayName || '',
              productId: plan.planId || '',
              price: plan.price?.amount?.toString() || '9.99',
              type: (plan.type as ProductType) || 'auto_renewable',
              duration: plan.duration || 'P1M',
              trialDays: plan.introOffer?.duration?.replace(/[PD]/g, '') || '7',
            }));
            setProducts(loadedProducts);
            console.log('[ConfigWizard] Loaded', loadedProducts.length, 'products from saved configuration');
          }
        } catch (e) {
          console.log('[ConfigWizard] Failed to parse saved configuration:', e);
        }
      }

      // Store initial values
      lastSavedValuesRef.current = JSON.stringify({
        revenueCatProjectId: projectData.revenueCatProjectId || "",
        revenueCatAppId: projectData.revenueCatIosAppId || "",
        products: products,
      });

      setHasLoadedInitialData(true);
    }
  }, [projectData, hasLoadedInitialData]);

  // Auto-save when fields change (debounced)
  useEffect(() => {
    if (!hasLoadedInitialData || !userId || !projectData) return;

    const currentValues = JSON.stringify({
      revenueCatProjectId: revenueCatProjectId.trim(),
      revenueCatAppId: revenueCatAppId.trim(),
      products: products,
    });

    // Don't save if nothing changed
    if (currentValues === lastSavedValuesRef.current) {
      return;
    }

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set saving indicator
    setSaveStatus('saving');

    // Set new timer for 1.5 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      const configYaml = generateYAML(projectData);
      const values = {
        configYaml,
        revenueCatProjectId: revenueCatProjectId.trim(),
        revenueCatIosAppId: revenueCatAppId.trim(),
      };

      // Update last saved values
      lastSavedValuesRef.current = currentValues;

      autoSaveMutation.mutate(values);
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [revenueCatProjectId, revenueCatAppId, products, hasLoadedInitialData, userId, projectData]);

  const addProduct = () => {
    console.log("[ConfigWizard] Adding new product to list");
    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        name: "",
        productId: "",
        price: "9.99",
        type: "auto_renewable",
        duration: "P1M",
        trialDays: "7",
      },
    ]);
  };

  const removeProduct = (id: string) => {
    console.log("[ConfigWizard] Removing product:", id);
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Auto-save indicator */}
        {saveStatus !== 'idle' && (
          <View className={`rounded-lg p-3 mb-4 flex-row items-center ${
            saveStatus === 'saving' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
          }`}>
            {saveStatus === 'saving' ? (
              <>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-blue-800 text-xs ml-2">Saving...</Text>
              </>
            ) : (
              <>
                <Check size={16} color="#16a34a" />
                <Text className="text-green-800 text-xs ml-2">Saved</Text>
              </>
            )}
          </View>
        )}

        {/* RevenueCat Help Modal */}
        <HelpModal
          visible={showRevenueCatHelp}
          onClose={() => setShowRevenueCatHelp(false)}
          title="How to Find RevenueCat IDs"
          steps={[
            {
              title: "Find Your Project ID",
              description: "1. Go to app.revenuecat.com\n2. In the left sidebar, click the gear icon (⚙️) next to your project name\n3. This opens 'Project settings'\n4. Look at the very top - you'll see 'Project ID: proj_xxxxx'\n5. Copy the entire ID (starts with 'proj_')",
            },
            {
              title: "Find Your RevenueCat App ID",
              description: "1. In the left sidebar, click 'Apps'\n2. Click on your iOS app name\n3. In the top section, look for 'App ID'\n4. It's labeled as 'App ID: app_xxxxx' (NOT the Bundle ID below it)\n5. Copy the entire ID (starts with 'app_')\n\nNote: This is RevenueCat's internal app ID, different from Apple's Bundle ID.",
            },
            {
              title: "If You Don't Have an iOS App Yet",
              description: "1. In the left sidebar, click 'Apps'\n2. Click '+ New' button at the top right\n3. Select 'Apple App Store'\n4. Enter your Bundle ID (e.g., com.yourcompany.appname)\n5. Give it a name and click 'Add app'\n6. Now you can find the App ID as described above",
            },
          ]}
        />

        <Text className="text-xl font-bold text-slate-900 mb-2">
          Configure Your Products
        </Text>
        <Text className="text-sm text-slate-600 mb-6">
          Set up your in-app purchases. We&apos;ll generate the configuration automatically.
        </Text>

        {/* RevenueCat Settings */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-slate-900">RevenueCat Settings</Text>
            <Pressable
              onPress={() => setShowRevenueCatHelp(true)}
              className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg"
            >
              <HelpCircle size={16} color="#3b82f6" />
              <Text className="text-blue-600 font-medium text-xs ml-1">Help</Text>
            </Pressable>
          </View>

          <Text className="text-sm text-slate-700 mb-1">Project ID</Text>
          <TextInput
            value={revenueCatProjectId}
            onChangeText={setRevenueCatProjectId}
            placeholder="e.g., proj_abc123"
            className="bg-slate-50 rounded-lg p-3 mb-3 text-slate-900"
            cursorColor="#3b82f6"
          />

          <Text className="text-sm text-slate-700 mb-1">RevenueCat App ID</Text>
          <TextInput
            value={revenueCatAppId}
            onChangeText={setRevenueCatAppId}
            placeholder="e.g., app_abc123"
            className="bg-slate-50 rounded-lg p-3 mb-2 text-slate-900"
            cursorColor="#3b82f6"
          />

          <Text className="text-xs text-slate-500">
            Find these in your RevenueCat dashboard (Project Settings for Project ID, Apps section for App ID)
          </Text>
        </View>

        {/* Products */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-slate-900">Products</Text>
            <Pressable onPress={addProduct} className="flex-row items-center">
              <Plus size={16} color="#3b82f6" />
              <Text className="text-blue-600 ml-1 font-medium">Add</Text>
            </Pressable>
          </View>

          {products.map((product, index) => {
            const isSubscription = product.type === "auto_renewable";

            return (
            <View key={product.id} className="mb-4 pb-4 border-b border-slate-100 last:border-b-0">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-slate-700">
                  Product {index + 1}
                </Text>
                {products.length > 1 && (
                  <Pressable onPress={() => removeProduct(product.id)}>
                    <Trash2 size={16} color="#ef4444" />
                  </Pressable>
                )}
              </View>

              {/* Product Type Selector */}
              <Text className="text-xs text-slate-600 mb-1">Type</Text>
              <View className="flex-row gap-2 mb-2">
                <Pressable
                  onPress={() => updateProduct(product.id, "type", "auto_renewable")}
                  className={`flex-1 p-2 rounded-lg border ${
                    product.type === "auto_renewable"
                      ? "bg-blue-50 border-blue-500"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text className={`text-xs text-center font-medium ${
                    product.type === "auto_renewable" ? "text-blue-700" : "text-slate-600"
                  }`}>Subscription</Text>
                </Pressable>
                <Pressable
                  onPress={() => updateProduct(product.id, "type", "non_consumable")}
                  className={`flex-1 p-2 rounded-lg border ${
                    product.type === "non_consumable"
                      ? "bg-green-50 border-green-500"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text className={`text-xs text-center font-medium ${
                    product.type === "non_consumable" ? "text-green-700" : "text-slate-600"
                  }`}>Lifetime</Text>
                </Pressable>
                <Pressable
                  onPress={() => updateProduct(product.id, "type", "consumable")}
                  className={`flex-1 p-2 rounded-lg border ${
                    product.type === "consumable"
                      ? "bg-amber-50 border-amber-500"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text className={`text-xs text-center font-medium ${
                    product.type === "consumable" ? "text-amber-700" : "text-slate-600"
                  }`}>Consumable</Text>
                </Pressable>
              </View>

              <Text className="text-xs text-slate-600 mb-1">Name</Text>
              <TextInput
                value={product.name}
                onChangeText={(v) => updateProduct(product.id, "name", v)}
                placeholder={isSubscription ? "e.g., Pro Monthly" : "e.g., Lifetime Access"}
                className="bg-slate-50 rounded-lg p-2 mb-2 text-sm"
                cursorColor="#3b82f6"
              />

              <Text className="text-xs text-slate-600 mb-1">Product ID</Text>
              <TextInput
                value={product.productId}
                onChangeText={(v) => updateProduct(product.id, "productId", v)}
                placeholder={isSubscription ? "e.g., pro_monthly" : "e.g., lifetime_pro"}
                className="bg-slate-50 rounded-lg p-2 mb-2 text-sm"
                cursorColor="#3b82f6"
              />

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-slate-600 mb-1">Price (USD)</Text>
                  <TextInput
                    value={product.price}
                    onChangeText={(v) => updateProduct(product.id, "price", v)}
                    placeholder={isSubscription ? "9.99" : "49.99"}
                    keyboardType="decimal-pad"
                    className="bg-slate-50 rounded-lg p-2 text-sm"
                    cursorColor="#3b82f6"
                  />
                </View>

                {/* Only show Duration and Trial for subscriptions */}
                {isSubscription && (
                  <View className="flex-1">
                    <Text className="text-xs text-slate-600 mb-1">Trial Days</Text>
                    <TextInput
                      value={product.trialDays}
                      onChangeText={(v) => updateProduct(product.id, "trialDays", v)}
                      placeholder="7"
                      keyboardType="number-pad"
                      className="bg-slate-50 rounded-lg p-2 text-sm"
                      cursorColor="#3b82f6"
                    />
                  </View>
                )}
              </View>

              {/* Duration selector for subscriptions */}
              {isSubscription && (
                <View className="mt-2">
                  <Text className="text-xs text-slate-600 mb-1">Duration</Text>
                  <View className="flex-row gap-1">
                    {[
                      { value: "P1W", label: "Weekly" },
                      { value: "P1M", label: "Monthly" },
                      { value: "P1Y", label: "Yearly" },
                    ].map((dur) => (
                      <Pressable
                        key={dur.value}
                        onPress={() => updateProduct(product.id, "duration", dur.value)}
                        className={`flex-1 p-2 rounded-lg border ${
                          product.duration === dur.value
                            ? "bg-blue-50 border-blue-500"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <Text className={`text-xs text-center ${
                          product.duration === dur.value ? "text-blue-700 font-medium" : "text-slate-600"
                        }`}>{dur.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )})}
        </View>

        <View className="bg-blue-50 rounded-xl p-4 mb-4">
          <Text className="text-sm text-blue-900 font-medium mb-1">
            Auto-Generated Configuration
          </Text>
          <Text className="text-xs text-blue-700">
            App name, bundle ID, subscription groups, entitlements, and offerings are automatically configured based on your project settings.
          </Text>
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-slate-200">
        <Pressable
          onPress={() => saveMutation.mutate()}
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
    </KeyboardAvoidingView>
  );
};

export default ConfigWizardScreen;
