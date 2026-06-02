"use client";

import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { selectedModelAtom, MODELS, userAtom, conversationsAtom, isAssessmentCompleteAtom } from "@/store/atoms";
import { saveUserProfile } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import {
  Bell,
  Moon,
  Globe,
  Shield,
  Trash2,
  ChevronRight,
  Check,
  LogOut,
  User,
  Settings,
  CreditCard,
  Lock,
  X,
  Wrench,
  Plug,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { SubscriptionContent } from "@/components/settings/SubscriptionContent";

const NAV_ITEMS = [
  { id: "account", label: "Account", icon: User },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "personalization", label: "Personalization", icon: Wrench },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "subscription", label: "Manage Subscription", icon: CreditCard },
  { id: "datacontrol", label: "Data control", icon: Database },
  { id: "privacy", label: "Privacy & Security", icon: Lock },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();
  const [authUser, setUser] = useAtom(userAtom);
  const setConversations = useSetAtom(conversationsAtom);
  const setIsAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const displayName = authUser?.profile
    ? `${authUser.profile.firstName ?? ""} ${authUser.profile.lastName ?? ""}`.trim() || authUser.displayName
    : authUser?.displayName || "User";
  const email = authUser?.profile?.email || authUser?.email || "";
  const photoUrl =
    authUser?.profile?.photoUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName || "User"}`;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (auth) await signOut(auth);
      setUser(null);
      router.push("/");
    } catch {
      toast({ title: "Error signing out", description: "Please try again.", variant: "destructive" });
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
      toast({ description: "All history cleared. You will start fresh on next visit." });
      router.push("/");
    } catch {
      toast({ description: "Failed to clear history.", variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEF5] shrink-0">
        <h1 className="text-lg font-semibold text-[#151515]">Settings</h1>
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 border-r border-[#F0EEF5] py-4 flex flex-col overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm transition-colors text-left",
                activeTab === item.id
                  ? "bg-[#F5F0FF] text-[#151515] font-medium"
                  : "text-[#62646A] hover:bg-[#F7F7F7]",
              )}
            >
              <item.icon size={16} className={activeTab === item.id ? "text-[#8A38F5]" : "text-[#9B9B9B]"} />
              {item.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Log out at bottom */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm text-[#DF2E16] hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            <LogOut size={16} />
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Account */}
          {activeTab === "account" && (
            <div className="max-w-lg space-y-6">
              <h2 className="text-base font-semibold text-[#151515]">Account</h2>
              <div className="flex items-center gap-4 p-4 border border-[#E8E5F0] rounded-2xl bg-white">
                <img src={photoUrl} alt={displayName || "User"} className="w-14 h-14 rounded-full bg-purple-100 shrink-0 object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#151515] truncate">{displayName}</p>
                  {email && <p className="text-xs text-[#9B9B9B] truncate">{email}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">Default Model</h3>
                <div className="rounded-2xl border border-[#E8E5F0] bg-white overflow-hidden">
                  {MODELS.map((model, i) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAF8FF] transition-colors text-left",
                        i < MODELS.length - 1 && "border-b border-[#F0EEF5]",
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-[#151515]">{model.name}</p>
                        <p className="text-xs text-[#9B9B9B]">{model.description}</p>
                      </div>
                      {selectedModel.id === model.id && (
                        <div className="w-5 h-5 rounded-full bg-[#8A38F5] flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === "preferences" && (
            <div className="max-w-lg space-y-6">
              <h2 className="text-base font-semibold text-[#151515]">Preferences</h2>
              <div className="rounded-2xl border border-[#E8E5F0] bg-white overflow-hidden">
                {/* Dark Mode */}
                <button
                  onClick={() => setDarkMode((p) => !p)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAF8FF] transition-colors border-b border-[#F0EEF5]"
                >
                  <div className="flex items-center gap-3">
                    <Moon size={18} className="text-[#6B6B6B]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#151515]">Dark Mode</p>
                      <p className="text-xs text-[#9B9B9B]">Toggle dark theme</p>
                    </div>
                  </div>
                  <div className={cn("w-10 rounded-full transition-colors relative", darkMode ? "bg-[#8A38F5]" : "bg-[#E8E5F0]")} style={{ height: "22px" }}>
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", darkMode ? "translate-x-5" : "translate-x-0.5")} />
                  </div>
                </button>
                {/* Language */}
                <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAF8FF] transition-colors border-b border-[#F0EEF5]">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-[#6B6B6B]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#151515]">Language</p>
                      <p className="text-xs text-[#9B9B9B]">English (US)</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#BCBCBC]" />
                </button>
                {/* Notifications */}
                <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAF8FF] transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell size={18} className="text-[#6B6B6B]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#151515]">Notifications</p>
                      <p className="text-xs text-[#9B9B9B]">Manage alerts</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#BCBCBC]" />
                </button>
              </div>
            </div>
          )}

          {/* Manage Subscription */}
          {activeTab === "subscription" && (
            <div className="max-w-lg">
              <h2 className="text-base font-semibold text-[#151515] mb-6">Manage Subscription</h2>
              <SubscriptionContent />
            </div>
          )}

          {/* Placeholders */}
          {(activeTab === "personalization" || activeTab === "notifications" || activeTab === "integrations" || activeTab === "datacontrol") && (
            <div className="max-w-lg space-y-6">
              <h2 className="text-base font-semibold text-[#151515] capitalize">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h2>
              <div className="flex flex-col items-center justify-center py-20 text-[#9B9B9B]">
                <p className="text-sm">This section is coming soon.</p>
              </div>
            </div>
          )}

          {/* Privacy & Security */}
          {activeTab === "privacy" && (
            <div className="max-w-lg space-y-6">
              <h2 className="text-base font-semibold text-[#151515]">Privacy & Security</h2>
              {showClearConfirm ? (
                <div className="flex flex-col items-center justify-center py-16 gap-6">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 size={24} className="text-red-500" />
                  </div>
                  <div className="text-center max-w-sm">
                    <h3 className="text-base font-semibold text-[#151515] mb-2">Clear all history?</h3>
                    <p className="text-sm text-[#62646A]">This will delete all your conversations and reset your assessment. You'll start completely fresh. This cannot be undone.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowClearConfirm(false)} className="px-5 py-2.5 rounded-xl border border-[#ECEDEE] text-sm font-medium text-[#151515] hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleClearHistory} disabled={isClearing} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
                      {isClearing ? "Clearing…" : "Yes, clear everything"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E8E5F0] bg-white overflow-hidden">
                  <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAF8FF] transition-colors border-b border-[#F0EEF5]">
                    <div className="flex items-center gap-3">
                      <Shield size={18} className="text-[#6B6B6B]" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#151515]">Privacy Settings</p>
                        <p className="text-xs text-[#9B9B9B]">Control your data</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#BCBCBC]" />
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-red-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-red-500">Clear All History</p>
                        <p className="text-xs text-[#9B9B9B]">Delete all conversations and reset account</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#BCBCBC]" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
