import { onlineManager, QueryClient } from "@tanstack/react-query";
import * as Network from "expo-network";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute - prevents excessive refetching
      gcTime: 10 * 60 * 1000, // 10 minutes cache retention
    },
  },
});

onlineManager.setEventListener((setOnline) => {
  const eventSubscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected);
  });
  return eventSubscription.remove;
});

export { queryClient };
