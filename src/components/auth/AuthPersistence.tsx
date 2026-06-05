"use client";

import { useEffect } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
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

    getRedirectResult(auth).catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        clearTimeout(fallbackTimer);
        setLoading(false);
        return;
      }

      const appUid = firebaseUser.email || firebaseUser.uid;

      // Persist the email in the background — don't block the UI on it.
      // (The OAuth callback already saved it; this is just a safety net.)
      if (firebaseUser.email) {
        saveUserProfile(appUid, { email: firebaseUser.email }).catch(() => {});
      }

      // Single awaited round-trip so we know onboardingComplete before rendering.
      // Retry once on failure (mobile networks are flaky) before giving up.
      let profile = null;
      try {
        profile = await getUserProfile(appUid);
      } catch {
        try {
          profile = await getUserProfile(appUid);
        } catch {
          profile = null;
        }
      }

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
