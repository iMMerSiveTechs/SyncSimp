// ComponentWithDataFetchingExample.tsx
// This component demonstrates how to use the useQuery hook to fetch data from the API.
// It also demonstrates how to handle loading, error, and data states.
// YOU SHOULD REMOVE THIS COMPONENT AFTER YOU HAVE IMPLEMENTED YOUR OWN COMPONENT WITH DATA FETCHING.

import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { type GetSampleResponse } from "@/shared/contracts";

const Test = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["example"],
    queryFn: () => api.get<GetSampleResponse>("/api/sample"),
  });

  // Loading state
  if (isLoading) {
    return (
      <View>
        <Text>Fetching some data</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  // Data state
  return (
    <View>
      <Text>{data?.message}</Text>
    </View>
  );
};

export default Test;
