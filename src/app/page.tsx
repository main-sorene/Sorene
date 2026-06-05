"use client";
import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { useRouter, useSearchParams } from "next/navigation";
import { LandingPageScreen } from "@/pages-gitlab/LandingPage";
import { auth } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { Suspense } from "react";

function PageInner() {
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const setAuthLoading = useSetAtom(authLoadingAtom);
  const router = useRouter();
  const searchParams = useSearchParams();
  // True while we're completing the OAuth custom-token handshake. Keeps the
  // app in a loading state instead of flashing the landing page (which on
  // mobile looked like being "bounced back to the homepage" after login).
  const [signingIn, setSigningIn] = useState(
    () => !!searchParams.get("custom_token"),
  );

  useEffect(() => {
    const customToken = searchParams.get("custom_token");
    const authError = searchParams.get("auth_error");

    if (authError) {
      console.error("OAuth error:", authError);
      setSigningIn(false);
      router.replace("/");
      return;
    }

    if (customToken && auth) {
      // Gate rendering on the sign-in so the landing page never shows in the
      // window between "token received" and "auth state populated".
      setSigningIn(true);
      setAuthLoading(true);
      signInWithCustomToken(auth, customToken)
        .then(() => {
          // Strip the token from the URL only after sign-in succeeds.
          // onAuthStateChanged populates the user; the redirect effect navigates.
          router.replace("/");
        })
        .catch((e) => {
          console.error("signInWithCustomToken error:", e.message);
          setSigningIn(false);
          setAuthLoading(false);
          router.replace("/?auth_error=signin_failed");
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
      router.replace("/chat");
    } else {
      router.replace("/onBoarding");
    }
  }, [authLoading, authUser, router, signingIn]);

  if (authLoading || signingIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <LandingPageScreen />;
}

export default function Page() {
  return (
    <Suspense>
      <PageInner />
    </Suspense>
  );
}
