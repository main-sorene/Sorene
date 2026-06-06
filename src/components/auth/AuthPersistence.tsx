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
      const profile = await getUserProfile(appUid);

      // No profile means data was wiped — sign out so the user lands on the
      // homepage instead of being auto-routed to onboarding with a ghost session.
      if (!profile) {
        await signOut(auth!).catch(() => {});
        setUser(null);
        clearTimeout(fallbackTimer);
        setLoading(false);
        return;
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
