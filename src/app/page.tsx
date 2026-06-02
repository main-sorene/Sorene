"use client";
import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { useRouter } from "next/navigation";
import { LandingPageScreen } from "@/pages-gitlab/LandingPage";

export default function Page() {
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) return;
    if (authUser.profile?.onboardingComplete) {
      router.replace("/chat");
    } else {
      // Signed in (e.g. via Google redirect) but onboarding not done
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
