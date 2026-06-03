"use client";

import { useEffect } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSetAtom } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";

// Temporary debug helper — writes to a global array read by page.tsx
function dbg(msg: string) {
  if (typeof window !== "undefined") {
    (window as any).__authDebug = (window as any).__authDebug || [];
    (window as any).__authDebug.push(`${new Date().toLocaleTimeString()}: ${msg}`);
  }
}

export function AuthPersistence({ children }: { children: React.ReactNode }) {
  const setUser = useSetAtom(userAtom);
  const setLoading = useSetAtom(authLoadingAtom);

  useEffect(() => {
    if (!auth) { dbg("no auth"); setLoading(false); return; }

    dbg(`auth initialized, authDomain=${auth.config.authDomain}`);

    const fallbackTimer = setTimeout(() => {
      dbg("8s fallback timer fired");
      setLoading(false);
    }, 8000);

    getRedirectResult(auth).then((result) => {
      dbg(`getRedirectResult: ${result ? result.user.email : "null (no pending redirect)"}`);
    }).catch((err) => {
      dbg(`getRedirectResult error: ${err.code || err.message}`);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      dbg(`onAuthStateChanged: ${firebaseUser ? firebaseUser.email : "null"}`);
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
          dbg(`profile loaded: onboardingComplete=${profile?.onboardingComplete}`);

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
      } catch (e: any) {
        dbg(`auth error: ${e.message}`);
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
