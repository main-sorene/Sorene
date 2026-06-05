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
      if (!firebaseUser) {
        setUser(null);
        clearTimeout(fallbackTimer);
        setLoading(false);
        return;
      }

      const appUid = firebaseUser.email || firebaseUser.uid;

      // The ONLY thing on the critical path is reading the profile so we know
      // onboardingComplete before redirecting — a single round-trip. (Email is
      // saved by the onboarding form for new users; returning users already
      // have it, so no write is needed here.)
      const profile = await getUserProfile(appUid);

      // Clear any Google-sourced photo URL that was previously auto-saved.
      // Only data URLs (uploaded by user) should remain. Background-only.
      if (profile?.photoUrl && !profile.photoUrl.startsWith("data:")) {
        saveUserProfile(appUid, { photoUrl: undefined }).catch(() => {});
        profile.photoUrl = undefined;
      }

      // Always keep the authenticated user set. Never null out a signed-in
      // user just because the profile fetch hiccuped — that unmounts the
      // active page (e.g. onboarding) and resets its state.
      setUser({
        uid: appUid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        profile: profile || undefined,
      });
      clearTimeout(fallbackTimer);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
