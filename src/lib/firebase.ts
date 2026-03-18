import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Auth
} from "firebase/auth";
// @ts-ignore - getReactNativePersistence exists but TypeScript declarations are missing
import { getReactNativePersistence } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration from GoogleService-Info.plist
const firebaseConfig = {
  apiKey: "AIzaSyCG5VfBc0RHlXHHtPJemL06FLiESb7RSAY",
  authDomain: "syncsimp-12152025.firebaseapp.com",
  projectId: "syncsimp-12152025",
  storageBucket: "syncsimp-12152025.firebasestorage.app",
  messagingSenderId: "918396216946",
  appId: "1:918396216946:ios:3112fbef3c845dc18dc4eb",
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth: Auth;
try {
  // Try to initialize with persistence (first time)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log("[Firebase] Auth initialized with AsyncStorage persistence");
} catch (error) {
  // Auth already initialized, get existing instance
  auth = getAuth(app);
  console.log("[Firebase] Using existing auth instance");
}

// Initialize Firestore
const db = getFirestore(app);

console.log("[Firebase] Initialized with project:", firebaseConfig.projectId);

// ============================================
// AUTH FUNCTIONS
// ============================================

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("[Firebase] Sign in successful:", userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    // Log for debugging but don't show raw error to user
    console.log("[Firebase] Sign in failed:", error.code);

    // Return user-friendly error messages
    let friendlyMessage = "Sign in failed. Please try again.";
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        friendlyMessage = "Invalid email or password. Please check your credentials and try again.";
        break;
      case "auth/invalid-email":
        friendlyMessage = "Please enter a valid email address.";
        break;
      case "auth/user-disabled":
        friendlyMessage = "This account has been disabled. Please contact support.";
        break;
      case "auth/too-many-requests":
        friendlyMessage = "Too many failed attempts. Please try again later.";
        break;
      case "auth/network-request-failed":
        friendlyMessage = "Network error. Please check your connection and try again.";
        break;
    }

    return { success: false, error: friendlyMessage };
  }
};

export const signUp = async (email: string, password: string, name?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      name: name || null,
      hasCompletedOnboarding: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("[Firebase] Sign up successful:", user.email);
    return { success: true, user };
  } catch (error: any) {
    console.error("[Firebase] Sign up error:", error.code, error.message);
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log("[Firebase] Sign out successful");
    return { success: true };
  } catch (error: any) {
    console.error("[Firebase] Sign out error:", error.message);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================
// USER FUNCTIONS
// ============================================

export interface UserData {
  email: string;
  name: string | null;
  hasCompletedOnboarding: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("[Firebase] Error getting user data:", error);
    return null;
  }
};

export const updateUserData = async (userId: string, data: Partial<UserData>) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("[Firebase] Error updating user:", error);
    return { success: false, error: error.message };
  }
};

export const completeOnboarding = async (userId: string) => {
  return updateUserData(userId, { hasCompletedOnboarding: true });
};

export const resetOnboarding = async (userId: string) => {
  return updateUserData(userId, { hasCompletedOnboarding: false });
};

// ============================================
// PROJECT FUNCTIONS
// ============================================

export interface Project {
  id: string;
  userId: string;
  name: string;
  bundleId: string;
  platform: string;
  syncStatus: string;
  lastSyncError: string | null;
  lastSyncAt: Timestamp | null;
  lastCheckAt: Timestamp | null;
  configYaml: string | null;
  appleIssuerId: string | null;
  appleKeyId: string | null;
  appleP8FileContent: string | null;
  appleIapKeyId: string | null;
  appleIapP8Content: string | null;
  revenueCatApiKey: string | null;
  revenueCatProjectId: string | null;
  revenueCatIosAppId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });

    console.log("[Firebase] Fetched", projects.length, "projects");
    return projects;
  } catch (error) {
    console.error("[Firebase] Error getting projects:", error);
    return [];
  }
};

export const getProject = async (projectId: string, userId: string): Promise<Project | null> => {
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (projectDoc.exists()) {
      const project = { id: projectDoc.id, ...projectDoc.data() } as Project;
      // Verify ownership
      if (project.userId !== userId) {
        console.error("[Firebase] Project does not belong to user");
        return null;
      }
      return project;
    }
    return null;
  } catch (error) {
    console.error("[Firebase] Error getting project:", error);
    return null;
  }
};

export const createProject = async (userId: string, name: string, bundleId: string): Promise<Project | null> => {
  try {
    const projectRef = doc(collection(db, "projects"));
    const projectData = {
      userId,
      name,
      bundleId,
      platform: "ios",
      syncStatus: "not_synced",
      lastSyncError: null,
      lastSyncAt: null,
      lastCheckAt: null,
      configYaml: null,
      appleIssuerId: null,
      appleKeyId: null,
      appleP8FileContent: null,
      appleIapKeyId: null,
      appleIapP8Content: null,
      revenueCatApiKey: null,
      revenueCatProjectId: null,
      revenueCatIosAppId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(projectRef, projectData);

    console.log("[Firebase] Created project:", projectRef.id);
    return { id: projectRef.id, ...projectData } as unknown as Project;
  } catch (error) {
    console.error("[Firebase] Error creating project:", error);
    return null;
  }
};

export const updateProject = async (projectId: string, userId: string, updates: Partial<Project>) => {
  try {
    // Verify ownership first
    const existing = await getProject(projectId, userId);
    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    await updateDoc(doc(db, "projects", projectId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log("[Firebase] Updated project:", projectId);
    return { success: true };
  } catch (error: any) {
    console.error("[Firebase] Error updating project:", error);
    return { success: false, error: error.message };
  }
};

export const deleteProject = async (projectId: string, userId: string) => {
  try {
    // Verify ownership first
    const existing = await getProject(projectId, userId);
    if (!existing) {
      return { success: false, error: "Project not found" };
    }

    await deleteDoc(doc(db, "projects", projectId));

    console.log("[Firebase] Deleted project:", projectId);
    return { success: true };
  } catch (error: any) {
    console.error("[Firebase] Error deleting project:", error);
    return { success: false, error: error.message };
  }
};

// Export instances
export { auth, db, app };
