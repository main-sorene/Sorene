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

    // Fallback in case onAuthStateChanged never fires (e.g. Firebase init failure)
    const fallbackTimer = setTimeout(() => setLoading(false), 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(fallbackTimer);

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const appUid = firebaseUser.email || firebaseUser.uid;

      // Cap the Firestore read at 5s — on a slow mobile network an uncapped read
      // hangs indefinitely because the fallback timer was already cleared above.
      let profile = null;
      try {
        const timeout = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5000),
        );
        profile = await Promise.race([getUserProfile(appUid), timeout]);
      } catch {
        // Network slow, Firestore unavailable, or timed out — proceed without
        // profile. AppLayout will redirect to /onBoarding which creates it.
      }

      if (profile?.photoUrl && !profile.photoUrl.startsWith("data:")) {
        saveUserProfile(appUid, { photoUrl: undefined }).catch(() => {});
        profile.photoUrl = undefined;
      }

      setUser({
        uid: appUid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        profile: profile || undefined,
      });
      setLoading(false);
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

