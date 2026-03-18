import React from "react";
import { View } from "react-native";

import LoginWithEmailPassword from "@/components/LoginWithEmailPassword";

const LoginModalScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <LoginWithEmailPassword />
    </View>
  );
};

export default LoginModalScreen;
