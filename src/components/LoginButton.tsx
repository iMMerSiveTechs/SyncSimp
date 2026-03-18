import React from "react";
import { Pressable, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { signOut } from "@/lib/firebase";
import { useSession } from "@/lib/useSession";
import { cn } from "@/utils/cn";

const LoginButton = () => {
  const navigation = useNavigation();
  const { data: session, isPending } = useSession();

  const handlePress = async () => {
    if (session) {
      await signOut();
    } else {
      navigation.navigate("LoginModalScreen" as never);
    }
  };

  return (
    <Pressable
      disabled={isPending}
      onPress={handlePress}
      className={cn("p-4 rounded-md", session ? "bg-red-500" : "bg-blue-500")}
    >
      <Text className="text-white text-center font-semibold">
        {session ? "Logout" : "Login"}
      </Text>
    </Pressable>
  );
};

export default LoginButton;
