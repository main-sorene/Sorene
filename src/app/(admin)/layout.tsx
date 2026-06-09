"use client";

import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authLoadingAtom, userAtom } from "@/store/atoms";

const ADMIN_EMAILS = ["adam@sorene.ai", "mai@sorene.ai"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!authUser || !ADMIN_EMAILS.includes(authUser.email ?? "")) {
      router.replace("/");
    }
  }, [authLoading, authUser, router]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f7f7f7]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authUser || !ADMIN_EMAILS.includes(authUser.email ?? "")) return null;

  return <>{children}</>;
}
