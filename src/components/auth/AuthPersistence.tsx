"use client";

import { useEffect } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSetAtom } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useRouter } from "next/navigation";

export function AuthPersistence({ children }: { children: React.ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const setLoading = useSetAtom(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (!auth) { setLoading(false); return; }

    // Firebase v12 uses redirect internally on mobile even for signInWithPopup.
    // getRedirectResult must be called to finalize auth after returning from Google.
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      const user = result.user;
      const appUid = user.email || user.uid;
      try {
        if (user.photoURL || user.email) {
          await saveUserProfile(appUid, { photoUrl: user.photoURL || undefined, email: user.email || "" });
        }
        const profile = await getUserProfile(appUid);
        setUser({ uid: appUid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, profile: profile || undefined });
        setLoading(false);
        router.replace(profile?.onboardingComplete ? "/chat" : "/onBoarding");
      } catch {
        setLoading(false);
      }
    }).catch(() => {});

    // Safety: never hang more than 8 seconds
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
