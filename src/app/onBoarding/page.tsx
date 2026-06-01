"use client";
import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { useRouter } from "next/navigation";
import { OnBoardingPage } from "@/pages-gitlab/OnBoardingPage";

export default function Page() {
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/");
    } else if (!authLoading && authUser?.profile?.onboardingComplete) {
      router.replace("/chat");
    }
  }, [authLoading, authUser, router]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser) return null;

  return <OnBoardingPage />;
}
