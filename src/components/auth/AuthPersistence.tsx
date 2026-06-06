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
      if (!firebaseUser) {
        setUser(null);
        clearTimeout(fallbackTimer);
        setLoading(false);
        return;
      }

      const appUid = firebaseUser.email || firebaseUser.uid;
      let profile = await getUserProfile(appUid);

      if (!profile) {
        // Check if this is a fresh OAuth sign-in. The OAuth callback writes the
        // profile server-side (Admin SDK) and there can be a brief Firestore
        // replication lag before the client SDK can read it. In that case we
        // retry once rather than treating it as a wiped account.
        let isFreshSignIn = false;
        try {
          isFreshSignIn = sessionStorage.getItem("sorene_fresh_signin") === "1";
          sessionStorage.removeItem("sorene_fresh_signin");
        } catch {}

        if (isFreshSignIn) {
          // Wait for profile to replicate then retry
          await new Promise((r) => setTimeout(r, 1200));
          profile = await getUserProfile(appUid);
        }

        // Still no profile after retry → this is a session from before the
        // data wipe. Sign out silently so they land on the homepage.
        if (!profile) {
          await signOut(auth!).catch(() => {});
          setUser(null);
          clearTimeout(fallbackTimer);
          setLoading(false);
          return;
        }
      }

      // Clear any Google-sourced photo URL. Background-only.
      if (profile.photoUrl && !profile.photoUrl.startsWith("data:")) {
        saveUserProfile(appUid, { photoUrl: undefined }).catch(() => {});
        profile.photoUrl = undefined;
      }

      setUser({
        uid: appUid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        profile,
      });
      clearTimeout(fallbackTimer);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
