"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { useEffect, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  sidebarOpenAtom,
  isSettingsOpenAtom,
  userAtom,
  authLoadingAtom,
  isAssessmentCompleteAtom,
} from "@/store/atoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { SettingsModal } from "../modals/SettingsModal";
import { LogoutConfirmModal } from "../modals/LogoutConfirmModal";
import { CancelSubscriptionDialog } from "../modals/CancelSubscriptionDialog";
import { ManagePaymentModal } from "../modals/ManagePaymentModal";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const [isAssessmentComplete, setIsAssessmentComplete] = useAtom(isAssessmentCompleteAtom);
  const pathname = usePathname();
  const router = useRouter();

  // Redirect unauthenticated users to landing page, incomplete onboarding to /onBoarding
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/");
    } else if (!authLoading && authUser && !authUser.profile?.onboardingComplete) {
      router.replace("/onBoarding");
    }
  }, [authLoading, authUser, router]);

  // Sync assessment complete state from Firestore profile
  useEffect(() => {
    if (authUser?.profile?.dnaAssessmentComplete && !isAssessmentComplete) {
      setIsAssessmentComplete(true);
    }
  }, [authUser, isAssessmentComplete, setIsAssessmentComplete]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // Show spinner while auth is loading
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f7f7f7]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render protected content for unauthenticated users
  if (!authUser) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f7f7f7]">
      {/* Desktop Sidebar — dark panel */}
      <motion.aside
        initial={false}
        animate={{
          width: !isAssessmentComplete ? 0 : sidebarCollapsed ? 84 : 270,
          opacity: !isAssessmentComplete ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col shrink-0 h-full overflow-hidden"
        style={{
          pointerEvents: isAssessmentComplete ? "auto" : "none",
        }}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </motion.aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && isAssessmentComplete && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            data-testid="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden shadow-2xl">
            <Sidebar mobile />
          </aside>
        </>
      )}

      {/* Main Content — white panel */}
      <div className="flex m-2 flex-col flex-1 min-w-0 h-full overflow-hidden rounded-4xl bg-white">
        {pathname.startsWith("/chat") ? (
          <ChatHeader />
        ) : (
          <div className="flex items-center justify-between h-12 px-4 pt-4 shrink-0 lg:hidden">
            {isAssessmentComplete && (
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              >
                <Menu size={20} />
              </button>
            )}
            {!isAssessmentComplete && <div className="w-8" />}{" "}
            {/* Spacer to maintain alignment if needed */}
            <img
              src={
                authUser?.profile?.photoUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.displayName || "User"}`
              }
              alt="User Avatar"
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8  rounded-full cursor-pointer object-cover hover:opacity-90 transition-opacity"
            />
          </div>
        )}
        {children}
      </div>
      {/* Global Modals */}
      <SettingsModal />
      <LogoutConfirmModal />
      <CancelSubscriptionDialog />
      <ManagePaymentModal />
    </div>
  );
}
