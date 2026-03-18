import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { onAuthChange, getUserData, type UserData } from "./firebase";
import type { User as FirebaseUser } from "firebase/auth";

export interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    hasCompletedOnboarding: boolean;
  };
}

export const useFirebaseSession = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isPending, setIsPending] = useState(true);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log("[useFirebaseSession] Initializing auth listener");

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log("[useFirebaseSession] Auth state changed:", firebaseUser?.email || "null");
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user data from Firestore
        try {
          const data = await getUserData(firebaseUser.uid);
          setUserData(data);
        } catch (err) {
          console.log("[useFirebaseSession] Failed to fetch user data:", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setIsPending(false);
    });

    return () => {
      console.log("[useFirebaseSession] Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  // Memoize session to prevent unnecessary re-renders
  // Only create a new session object when the actual data changes
  const session: Session | null = useMemo(() => {
    if (!user || !userData) return null;

    return {
      user: {
        id: user.uid,
        email: user.email || "",
        name: userData.name,
        hasCompletedOnboarding: userData.hasCompletedOnboarding,
      },
    };
  }, [user?.uid, user?.email, userData?.name, userData?.hasCompletedOnboarding]);

  const refetch = useCallback(async () => {
    if (user) {
      const data = await getUserData(user.uid);
      setUserData(data);
    }
  }, [user]);

  return {
    data: session,
    isPending,
    error: null,
    refetch,
  };
};
