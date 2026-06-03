"use client";
import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { useRouter, useSearchParams } from "next/navigation";
import { LandingPageScreen } from "@/pages-gitlab/LandingPage";
import { auth } from "@/lib/firebase";
import { signInWithCustomToken } from "firebase/auth";
import { Suspense } from "react";

function PageInner() {
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const customToken = searchParams.get("custom_token");
    const authError = searchParams.get("auth_error");

    if (authError) {
      console.error("OAuth error:", authError);
      router.replace("/");
      return;
    }

    if (customToken && auth) {
      router.replace("/");
      signInWithCustomToken(auth, customToken).catch((e) =>
        console.error("signInWithCustomToken error:", e.message),
      );
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) return;
    if (authUser.profile?.onboardingComplete) {
      router.replace("/chat");
    } else {
      router.replace("/onBoarding");
    }
  }, [authLoading, authUser, router]);

  if (authLoading) {
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
