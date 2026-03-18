import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Plus, Folder, AlertCircle } from "lucide-react-native";
import type { BottomTabScreenProps } from "@/navigation/types";
import { getProjects, type Project } from "@/lib/firebase";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSession } from "@/lib/useSession";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";

type Props = BottomTabScreenProps<"ProjectsTab">;

const ProjectsScreen = ({ navigation }: Props) => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: session, isPending: isSessionLoading } = useSession();

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ["projects", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const result = await getProjects(session.user.id);
      console.log("[ProjectsScreen] Projects fetched:", result.length);
      return result;
    },
    retry: false,
    enabled: !!session?.user?.id,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Refetch projects when screen comes into focus (e.g., after logging in)
  useFocusEffect(
    React.useCallback(() => {
      if (session?.user?.id) {
        refetch();
      }
    }, [refetch, session?.user?.id])
  );

  // Helper to format sync status display
  const formatSyncStatus = (status: string | null | undefined) => {
    switch (status) {
      case "success": return "Synced";
      case "syncing": return "Syncing...";
      case "error": return "Error";
      case "not_synced": return "Not Synced";
      default: return "Unknown";
    }
  };

  const getSyncStatusStyle = (status: string | null | undefined) => {
    switch (status) {
      case "success": return { bg: "bg-green-100", text: "text-green-800" };
      case "syncing": return { bg: "bg-blue-100", text: "text-blue-800" };
      case "error": return { bg: "bg-red-100", text: "text-red-800" };
      default: return { bg: "bg-slate-100", text: "text-slate-800" };
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="mb-4">
          <Text className="text-2xl font-bold text-slate-900">Projects</Text>
          <Text className="text-slate-600 mt-1">
            Manage your in-app purchase sync projects
          </Text>
        </View>

        {/* Show loading while checking session or fetching projects */}
        {(isSessionLoading || isLoading) && (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-400 mt-4">
              {isSessionLoading ? "Checking session..." : "Loading projects..."}
            </Text>
          </View>
        )}

        {/* Show login prompt only if session check is complete and no session */}
        {!isSessionLoading && !session && !isLoading && (
          <View className="items-center justify-center py-16">
            <AlertCircle size={48} color="#f59e0b" />
            <Text className="text-amber-600 text-center mt-4 font-semibold">
              Please log in to continue
            </Text>
            <Text className="text-slate-600 text-center mt-2 px-4">
              You need to be logged in to view your projects.
            </Text>
            <Pressable
              onPress={() => rootNavigation.navigate("LoginModalScreen")}
              className="bg-blue-600 rounded-lg px-6 py-3 mt-4"
            >
              <Text className="text-white font-semibold">Log In</Text>
            </Pressable>
          </View>
        )}

        {error && (
          <View className="items-center justify-center py-16">
            <AlertCircle size={48} color="#ef4444" />
            <Text className="text-red-600 text-center mt-4 font-semibold">
              Failed to load projects
            </Text>
            <Text className="text-slate-600 text-center mt-2 px-4">
              Please check your connection and try again.
            </Text>
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => refetch()}
                className="bg-blue-600 rounded-lg px-6 py-3"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!isLoading && !error && session && projects && projects.length === 0 && (
          <View className="items-center justify-center py-16">
            <Folder size={48} color="#cbd5e1" />
            <Text className="text-slate-400 text-center mt-4 mb-6">
              No projects yet. Create your first project to get started.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("CreateProject")}
              className="bg-blue-600 rounded-lg px-6 py-3"
            >
              <Text className="text-white font-semibold">Create Project</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && session && projects && projects.length > 0 && (
          <View className="gap-3">
            {projects.map((project) => {
              const statusStyle = getSyncStatusStyle(project.syncStatus);
              return (
                <Pressable
                  key={project.id}
                  onPress={() => navigation.navigate("ProjectDetail", { projectId: project.id })}
                  className="bg-white rounded-xl p-4 border border-slate-200"
                >
                  <View className="flex-row items-center mb-2">
                    <Folder size={20} color="#3b82f6" />
                    <Text className="text-lg font-semibold text-slate-900 ml-2">
                      {project.name}
                    </Text>
                  </View>
                  <Text className="text-sm text-slate-600">{project.bundleId}</Text>
                  <View className="flex-row items-center mt-2">
                    <View className={`px-2 py-1 rounded ${statusStyle.bg}`}>
                      <Text className={`text-xs font-medium ${statusStyle.text}`}>
                        {formatSyncStatus(project.syncStatus)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating action button */}
      {session && (
        <Pressable
          onPress={() => navigation.navigate("CreateProject")}
          className="absolute bottom-20 right-6 bg-blue-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        >
          <Plus size={28} color="white" />
        </Pressable>
      )}
    </View>
  );
};

export default ProjectsScreen;
