"use client";

import * as React from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  isSettingsOpenAtom,
  settingsTabAtom,
  userAtom,
  conversationsAtom,
  isAssessmentCompleteAtom,
} from "@/store/atoms";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  Wrench,
  Bell,
  Plug,
  CreditCard,
  Database,
  Lock,
  LogOut,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { SubscriptionContent } from "@/components/settings/SubscriptionContent";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { saveUserProfile } from "@/lib/firestore";

const SIDEBAR_ITEMS = [
  { id: "Account", icon: User, label: "Account" },
  { id: "Preferences", icon: Settings, label: "Preferences" },
  { id: "Personalization", icon: Wrench, label: "Personalization" },
  { id: "Notifications", icon: Bell, label: "Notifications" },
  { id: "Integrations", icon: Plug, label: "Integrations" },
  { id: "Manage Subscription", icon: CreditCard, label: "Manage Subscription" },
  { id: "Data control", icon: Database, label: "Data control" },
  { id: "Security", icon: Lock, label: "Privacy & Security" },
];

const MODELS = [
  { id: "sorene-1", label: "Sorene 1.0", description: "Most capable" },
  { id: "sorene-1-mini", label: "Sorene 1.0 Mini", description: "Faster & lighter" },
  { id: "sorene-lite", label: "Sorene Lite", description: "Balanced" },
];

export function SettingsModal() {
  const [isOpen, setIsOpen] = useAtom(isSettingsOpenAtom);
  const [activeTab, setActiveTab] = useAtom(settingsTabAtom);
  const { data: subscription } = useSubscriptionStatus();
  const setConversations = useSetAtom(conversationsAtom);
  const setIsAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const [, setUser] = useAtom(userAtom);
  const authUser = useAtomValue(userAtom);
  const { toast } = useToast();
  const router = useRouter();
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState("sorene-1");

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    setShowClearConfirm(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (auth) await signOut(auth);
      setUser(null);
      setIsOpen(false);
      router.push("/");
    } catch {
      toast({ title: "Error signing out", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      setConversations([]);
      setIsAssessmentComplete(false);
      try {
        Object.keys(sessionStorage).filter(k => k.startsWith("assessment_state_")).forEach(k => sessionStorage.removeItem(k));
      } catch {}
      if (authUser?.uid) {
        await saveUserProfile(authUser.uid, {
          onboardingComplete: false,
          dnaAssessmentComplete: false,
          assessmentAnswers: undefined,
          directionText: undefined,
          dnaScores: undefined,
        } as any);
        setUser((prev) => prev ? { ...prev, profile: prev.profile ? { ...prev.profile, onboardingComplete: false, dnaAssessmentComplete: false } : prev.profile } : prev);
      }
      setShowClearConfirm(false);
      setIsOpen(false);
      toast({ description: "All history cleared." });
      router.push("/");
    } catch {
      toast({ description: "Failed to clear history.", variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  const filteredSidebarItems = SIDEBAR_ITEMS.filter((item) => {
    if (item.id === "Manage Subscription") return !!subscription?.active;
    return true;
  });

  // Derive display name and initial
  const displayName = authUser?.displayName || authUser?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const email = authUser?.email || "";

  const renderContent = () => {
    if (showClearConfirm) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 py-20">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-lg font-semibold text-[#151515] mb-2">Clear all history?</h2>
            <p className="text-sm text-[#62646A]">This will delete all your conversations and reset your assessment. You'll start completely fresh. This cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowClearConfirm(false)} className="px-5 py-2.5 rounded-xl border border-[#ECEDEE] text-sm font-medium text-[#151515] hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleClearHistory} disabled={isClearing} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isClearing ? "Clearing…" : "Yes, clear everything"}
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "Account":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#151515]">Account</h2>
            {/* User card */}
            <div className="rounded-2xl border border-[#ECEDEE] p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg font-semibold shrink-0">
                {initial}
              </div>
              <div>
                <p className="font-medium text-[#151515] text-[15px]">{displayName}</p>
                <p className="text-sm text-[#62646A]">{email}</p>
              </div>
            </div>
            {/* Model selector */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">Default Model</p>
              <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden divide-y divide-[#ECEDEE]">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#151515]">{model.label}</p>
                      <p className="text-xs text-[#9B9B9B]">{model.description}</p>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                        <Check size={13} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "Manage Subscription":
        return <SubscriptionContent />;
      case "Security":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#151515]">Privacy & Security</h2>
            <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-red-500">Clear All History</p>
                  <p className="text-xs text-[#9B9B9B]">Delete all conversations and reset account</p>
                </div>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-xl font-medium">{activeTab}</h2>
            <p className="text-sm mt-1">This section is coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full h-full sm:w-[95vw] sm:max-w-[900px] sm:h-[85vh] bg-white sm:rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 flex flex-col py-6 px-3 border-r border-[#F0F0F0]">
          <div className="flex items-center justify-between px-2 mb-5">
            <span className="text-base font-semibold text-[#151515]">Settings</span>
          </div>
          <nav className="flex-1 space-y-0.5">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !showClearConfirm;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowClearConfirm(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all text-left",
                    isActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-[#444] hover:bg-gray-100 hover:text-[#151515]"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-purple-600" : "text-[#6B6B6B]"} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium text-red-500 hover:bg-red-50 transition-all disabled:opacity-60"
          >
            <LogOut size={16} />
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </aside>

        {/* Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Close button */}
          <div className="flex justify-end px-5 pt-4 pb-2 shrink-0">
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#6B6B6B]">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
