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

      // Check for pending OAuth flag set before navigation — fresh sign-in.
      let isPendingOAuth = false;
      try {
        isPendingOAuth =
          sessionStorage.getItem("sorene_pending_oauth") === "1" ||
          sessionStorage.getItem("sorene_fresh_signin") === "1";
        sessionStorage.removeItem("sorene_pending_oauth");
        sessionStorage.removeItem("sorene_fresh_signin");
      } catch {}

      let profile = null;
      try {
        profile = await getUserProfile(appUid);
      } catch {
        // Firestore read failed — keep user signed in, don't bounce.
      }

      if (!profile && !isPendingOAuth) {
        // No profile and no active OAuth flow = stale session after data wipe.
        await signOut(auth!).catch(() => {});
        setUser(null);
        setLoading(false);
        return;
      }

      // If no profile yet but OAuth is in flight, wait for the client-side
      // profile write in page.tsx to complete, then retry.
      if (!profile && isPendingOAuth) {
        await new Promise((r) => setTimeout(r, 2000));
        try { profile = await getUserProfile(appUid); } catch {}
        // If still nothing, proceed anyway — onboarding will create it.
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
