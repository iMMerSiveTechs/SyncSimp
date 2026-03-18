import type { BottomTabScreenProps as BottomTabScreenPropsBase } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList> | undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
  EditConfig: { projectId: string };
  ConfigWizard: { projectId: string };
  Credentials: { projectId: string };
  Check: { projectId: string };
  Sync: { projectId: string };
  ScreenshotTool: { projectId: string };
  VideoTool: { projectId: string };
  LoginModalScreen: undefined;
  OnboardingWelcome: undefined;
  OnboardingFeatures: undefined;
  OnboardingUpgrade: undefined;
};

export type BottomTabParamList = {
  ProjectsTab: undefined;
  SettingsTab: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type BottomTabScreenProps<Screen extends keyof BottomTabParamList> = CompositeScreenProps<
  BottomTabScreenPropsBase<BottomTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
