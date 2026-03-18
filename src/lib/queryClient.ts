import { onlineManager, QueryClient } from "@tanstack/react-query";
import * as Network from "expo-network";

const queryClient = new QueryClient();

onlineManager.setEventListener((setOnline) => {
  const eventSubscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected);
  });
  return eventSubscription.remove;
});

export { queryClient };
