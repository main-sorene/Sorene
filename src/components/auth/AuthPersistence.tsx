"use client";

import { useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
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
      clearTimeout(fallbackTimer);
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const appUid = firebaseUser.email || firebaseUser.uid;

      let profile = null;
      try {
        profile = await getUserProfile(appUid);
      } catch {
        // Firestore read failed (offline / network issue). Keep the user
        // signed in — don't bounce them to the homepage.
      }

      if (!profile) {
        // No Firestore profile. Could be a fresh OAuth sign-in where the server
        // write hasn't replicated yet, OR a stale session after a data wipe.
        // Check the sessionStorage flag set by page.tsx before signInWithCustomToken.
        let isFreshSignIn = false;
        try {
          isFreshSignIn = sessionStorage.getItem("sorene_fresh_signin") === "1";
          sessionStorage.removeItem("sorene_fresh_signin");
        } catch {}

        if (isFreshSignIn) {
          // Wait for Firestore replication then retry once.
          await new Promise((r) => setTimeout(r, 1500));
          try { profile = await getUserProfile(appUid); } catch {}
        }

        if (!profile) {
          // Still no profile — stale session from before a data wipe. Sign out.
          await signOut(auth!).catch(() => {});
          setUser(null);
          setLoading(false);
          return;
        }
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
