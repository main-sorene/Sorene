"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSetAtom } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";

export function AuthPersistence({ children }: { children: React.ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const setLoading = useSetAtom(authLoadingAtom);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }

    const fallbackTimer = setTimeout(() => setLoading(false), 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const appUid = firebaseUser.email || firebaseUser.uid;

          if (firebaseUser.email) {
            await saveUserProfile(appUid, {
              email: firebaseUser.email,
              photoUrl: firebaseUser.photoURL || undefined,
            });
          }

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
      } catch {
        setUser(null);
      } finally {
        clearTimeout(fallbackTimer);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
