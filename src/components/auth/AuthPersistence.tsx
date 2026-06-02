"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSetAtom } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { getUserProfile } from "@/lib/firestore";

export function AuthPersistence({ children }: { children: React.ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const setLoading = useSetAtom(authLoadingAtom);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Safety: never hang on loading more than 8 seconds
    const fallbackTimer = setTimeout(() => setLoading(false), 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const appUid = firebaseUser.email || firebaseUser.uid;
          const profile = await getUserProfile(appUid);
          setUser({
            uid: appUid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            profile: profile || undefined,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error restoring auth session:", error);
        setUser(null);
      } finally {
        clearTimeout(fallbackTimer);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
