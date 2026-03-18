import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { signIn, signUp, signOut } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import type { RootStackParamList } from "@/navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginWithEmailPassword() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email, password);

      if (!result.success) {
        Alert.alert("Sign In Failed", result.error || "Please check your credentials");
      } else {
        Alert.alert("Success", "Signed in successfully!");
        setEmail("");
        setPassword("");
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      if (__DEV__) console.log("[Auth] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(email, password, name);

      if (!result.success) {
        Alert.alert("Sign Up Failed", result.error || "Please try again");
      } else {
        console.log("[LoginWithEmailPassword] Sign up successful, navigating to onboarding");
        setEmail("");
        setPassword("");
        setName("");
        setIsSignUp(false);
        // Navigate to onboarding flow
        navigation.navigate("OnboardingWelcome");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      if (__DEV__) console.log("[Auth] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert("Success", "Signed out successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
      if (__DEV__) console.log("[Auth] Error:", error);
    }
  };

  // If user is already logged in, show sign out button
  if (session) {
    return (
      <KeyboardAwareScrollView>
        <View className="w-full p-6 gap-4">
          <View className="bg-green-50 p-4 rounded-lg border border-green-200">
            <Text className="text-lg font-semibold mb-1">Signed in as:</Text>
            <Text className="text-base">{session.user.name || "User"}</Text>
            <Text className="text-sm text-gray-600">{session.user.email}</Text>
          </View>
          <Pressable onPress={handleSignOut} className="bg-red-500 p-4 rounded-lg items-center">
            <Text className="text-white font-semibold text-base">Sign Out</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView>
      <View className="w-full p-6 gap-4">
        <Text className="text-2xl font-bold text-center mb-2">
          {isSignUp ? "Create Account" : "Sign In"}
        </Text>

        {isSignUp && (
          <View>
            <Text className="text-sm font-medium mb-2 text-gray-700">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-300 rounded-lg p-4 bg-white"
              autoCapitalize="words"
              editable={!isLoading}
              cursorColor="#3b82f6"
            />
          </View>
        )}

        <View>
          <Text className="text-sm font-medium mb-2 text-gray-700">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            className="border border-gray-300 rounded-lg p-4 bg-white"
            editable={!isLoading}
            cursorColor="#3b82f6"
          />
        </View>

        <View>
          <Text className="text-sm font-medium mb-2 text-gray-700">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            className="border border-gray-300 rounded-lg p-4 bg-white"
            editable={!isLoading}
            cursorColor="#3b82f6"
          />
        </View>

        <Pressable
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={isLoading}
          className={`p-4 rounded-lg items-center ${isLoading ? "bg-blue-300" : "bg-blue-500"}`}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={isLoading}
          className="items-center"
        >
          <Text className="text-blue-500 text-sm">
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}
