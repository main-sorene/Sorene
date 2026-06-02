"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, getGoogleRedirectResult } from "@/lib/firebase";
import { useSetAtom } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useRouter } from "next/navigation";

export function AuthPersistence({ children }: { children: React.ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const setLoading = useSetAtom(authLoadingAtom);
  const router = useRouter();

  // Handle post-redirect result from mobile Google sign-in
  useEffect(() => {
    getGoogleRedirectResult().then(async (result) => {
      if (!result) return;
      const user = result.user;
      const appUid = user.email || user.uid;
      if (user.photoURL || user.email) {
        await saveUserProfile(appUid, { photoUrl: user.photoURL || undefined, email: user.email || "" });
      }
      const profile = await getUserProfile(appUid);
      setUser({ uid: appUid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, profile: profile || undefined });
      router.push(profile?.onboardingComplete ? "/chat" : "/onBoarding");
    }).catch(() => {});
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdTokenResult();
          console.log("[AuthDebug] Firebase User authenticated:", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            claims: idToken.claims,
          });

          // Normalize UID: Use email if available, otherwise fallback to Firebase UID
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
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
