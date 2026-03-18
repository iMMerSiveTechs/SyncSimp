import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { FolderSync, Settings } from "lucide-react-native";

import type { BottomTabParamList, RootStackParamList } from "@/navigation/types";
import ProjectsScreen from "@/screens/ProjectsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ProjectDetailScreen from "@/screens/ProjectDetailScreen";
import CreateProjectScreen from "@/screens/CreateProjectScreen";
import EditConfigScreen from "@/screens/EditConfigScreen";
import ConfigWizardScreen from "@/screens/ConfigWizardScreen";
import CredentialsScreen from "@/screens/CredentialsScreen";
import CheckScreen from "@/screens/CheckScreen";
import SyncScreen from "@/screens/SyncScreen";
import ScreenshotToolScreen from "@/screens/ScreenshotToolScreen";
import VideoToolScreen from "@/screens/VideoToolScreen";
import LoginModalScreen from "@/screens/LoginModalScreen";
import OnboardingWelcomeScreen from "@/screens/OnboardingWelcomeScreen";
import OnboardingFeaturesScreen from "@/screens/OnboardingFeaturesScreen";
import OnboardingUpgradeScreen from "@/screens/OnboardingUpgradeScreen";

/**
 * RootStackNavigator
 * The root navigator for the app, which contains the bottom tab navigator and all the screens inside it
 */
const RootStack = createNativeStackNavigator<RootStackParamList>();
const RootNavigator = () => {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Tabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: "Project Details", gestureEnabled: true }}
      />
      <RootStack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{ title: "New Project", presentation: "modal" }}
      />
      <RootStack.Screen
        name="EditConfig"
        component={EditConfigScreen}
        options={{ title: "Edit Configuration" }}
      />
      <RootStack.Screen
        name="ConfigWizard"
        component={ConfigWizardScreen}
        options={{ title: "Configure Products" }}
      />
      <RootStack.Screen
        name="Credentials"
        component={CredentialsScreen}
        options={{ title: "Credentials" }}
      />
      <RootStack.Screen
        name="Check"
        component={CheckScreen}
        options={{ title: "Validation Check" }}
      />
      <RootStack.Screen
        name="Sync"
        component={SyncScreen}
        options={{ title: "Sync" }}
      />
      <RootStack.Screen
        name="ScreenshotTool"
        component={ScreenshotToolScreen}
        options={{ title: "Screenshot Tool" }}
      />
      <RootStack.Screen
        name="VideoTool"
        component={VideoToolScreen}
        options={{ title: "Video Tool" }}
      />
      <RootStack.Screen
        name="LoginModalScreen"
        component={LoginModalScreen}
        options={{ presentation: "modal", title: "Login" }}
      />
      <RootStack.Screen
        name="OnboardingWelcome"
        component={OnboardingWelcomeScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <RootStack.Screen
        name="OnboardingFeatures"
        component={OnboardingFeaturesScreen}
        options={{ title: "How It Helps", gestureEnabled: false }}
      />
      <RootStack.Screen
        name="OnboardingUpgrade"
        component={OnboardingUpgradeScreen}
        options={{ title: "Choose Your Plan", gestureEnabled: false }}
      />
    </RootStack.Navigator>
  );
};

/**
 * BottomTabNavigator
 * The bottom tab navigator for the app, which contains the main tabs
 */
const BottomTab = createBottomTabNavigator<BottomTabParamList>();
const BottomTabNavigator = () => {
  return (
    <BottomTab.Navigator
      initialRouteName="ProjectsTab"
      screenOptions={{
        tabBarStyle: {
          position: "absolute",
        },
        tabBarBackground: () => (
          <BlurView tint="light" intensity={50} style={StyleSheet.absoluteFill} />
        ),
      }}
      screenListeners={() => ({
        transitionStart: () => {
          Haptics.selectionAsync();
        },
      })}
    >
      <BottomTab.Screen
        name="ProjectsTab"
        component={ProjectsScreen}
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => <FolderSync size={size} color={color} />,
        }}
      />
      <BottomTab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
};

export default RootNavigator;
