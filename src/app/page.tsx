"use client";
import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { useRouter, useSearchParams } from "next/navigation";
import { LandingPageScreen } from "@/pages-gitlab/LandingPage";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { Suspense } from "react";

function PageInner() {
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(
    () => !!(searchParams.get("google_id_token") || searchParams.get("custom_token")),
  );
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const googleIdToken = searchParams.get("google_id_token");
    const authError = searchParams.get("auth_error");

    if (authError) {
      console.error("OAuth error:", authError);
      setAuthErrorMsg(authError);
      setSigningIn(false);
      router.replace("/");
      return;
    }

    if (googleIdToken && auth) {
      try { sessionStorage.setItem("sorene_fresh_signin", "1"); } catch {}
      setSigningIn(true);
      setAuthLoading(true);
      const credential = GoogleAuthProvider.credential(googleIdToken);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          // Ensure a Firestore profile exists for this user.
          const uid = result.user.email || result.user.uid;
          try {
            const existing = await getUserProfile(uid);
            if (!existing) {
              await saveUserProfile(uid, { email: result.user.email || uid } as any);
            }
          } catch (e) {
            console.warn("[page] profile ensure failed:", e);
          }
          router.replace("/");
        })
        .catch((e) => {
          console.error("signInWithCredential error:", e.message);
          setAuthErrorMsg(`signin_failed: ${e.message}`);
          setSigningIn(false);
          setAuthLoading(false);
          router.replace("/");
        });
    }
  }, [searchParams, router, setAuthLoading]);

  // Once the user is populated, the handshake is done — clear the gate.
  useEffect(() => {
    if (authUser) setSigningIn(false);
  }, [authUser]);

  // Safety fallback: never let the sign-in spinner hang indefinitely.
  useEffect(() => {
    if (!signingIn) return;
    const t = setTimeout(() => setSigningIn(false), 10000);
    return () => clearTimeout(t);
  }, [signingIn]);

  useEffect(() => {
    if (authLoading || signingIn) return;
    if (!authUser) return;
    if (authUser.profile?.onboardingComplete) {
      // Restore the last page the user was on before refresh/closing the app
      let lastRoute = "/chat";
      try {
        const saved = localStorage.getItem("sorene_last_route");
        if (saved && saved.startsWith("/") && saved !== "/") lastRoute = saved;
      } catch {}
      router.replace(lastRoute);
    } else {
      router.replace("/onBoarding");
    }
  }, [authLoading, authUser, router, signingIn]);

  // Show the spinner — never the landing page — whenever we're loading, signing
  // in, OR already authenticated. If authUser exists the redirect effect is about
  // to navigate to /onBoarding (or /chat); rendering the landing page in that
  // gap is the "flash of homepage before onboarding" users were seeing.
  if (authLoading || signingIn || authUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {authErrorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl shadow max-w-sm w-full mx-4 text-center">
          Sign-in failed: <strong>{authErrorMsg}</strong>
          <br /><span className="text-xs text-red-500">Please try again or contact support.</span>
        </div>
      )}
      <LandingPageScreen />
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <PageInner />
    </Suspense>
  );
}
