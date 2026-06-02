"use client";

import * as React from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  isSettingsOpenAtom,
  settingsTabAtom,
  isLogoutConfirmOpenAtom,
  userAtom,
  conversationsAtom,
} from "@/store/atoms";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  Shield,
  Bell,
  Layers,
  CreditCard,
  Database,
  Lock,
  LogOut,
  X,
  Moon,
  Globe,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { SubscriptionContent } from "@/components/settings/SubscriptionContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useToast } from "@/hooks/use-toast";

const SIDEBAR_ITEMS = [
  {
    id: "Account",
    icon: <img src="/figmaAssets/user-circle.svg" alt="" />,
    label: "Account",
  },
  {
    id: "Preferences",
    icon: <img src="/figmaAssets/paint-brush.svg" alt="" />,
    label: "Preferences",
  },
  {
    id: "Personalization",
    icon: <img src="/figmaAssets/wrench.svg" alt="" />,
    label: "Personalization",
  },
  {
    id: "Notifications",
    icon: <img src="/figmaAssets/bell.svg" alt="" />,
    label: "Notifications",
  },
  {
    id: "Integrations",
    icon: <img src="/figmaAssets/plugs.svg" alt="" />,
    label: "Integrations",
  },
  {
    id: "Manage Subscription",
    icon: <img src="/figmaAssets/gift.svg" alt="" />,
    label: "Manage Subscription",
  },
  {
    id: "Data control",
    icon: <img src="/figmaAssets/database.svg" alt="" />,
    label: "Data control",
  },
  {
    id: "Security",
    icon: <img src="/figmaAssets/key.svg" alt="" />,
    label: "Privacy & Security",
  },
];

export function SettingsModal() {
  const [isOpen, setIsOpen] = useAtom(isSettingsOpenAtom);
  const [activeTab, setActiveTab] = useAtom(settingsTabAtom);
  const setLogoutConfirmOpen = useSetAtom(isLogoutConfirmOpenAtom);
  const { data: subscription } = useSubscriptionStatus();
  const [darkMode, setDarkMode] = React.useState(false);
  const setConversations = useSetAtom(conversationsAtom);
  const { toast } = useToast();

  const handleClearHistory = () => {
    setConversations([]);
    toast({ description: "All conversation history cleared." });
  };

  const filteredSidebarItems = SIDEBAR_ITEMS.filter((item) => {
    if (item.id === "Manage Subscription") {
      return !!subscription?.active;
    }
    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case "Manage Subscription":
        return <SubscriptionContent />;
      case "Preferences":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-[#151515]">Preferences</h2>
            <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
              <button onClick={() => setDarkMode(p => !p)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-[#F0EEF5]">
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-[#6B6B6B]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#151515]">Dark Mode</p>
                    <p className="text-xs text-[#9B9B9B]">Toggle dark theme</p>
                  </div>
                </div>
                <div className={cn("w-10 rounded-full transition-colors relative shrink-0", darkMode ? "bg-[#8A38F5]" : "bg-[#E8E5F0]")} style={{ height: "22px" }}>
                  <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", darkMode ? "translate-x-5" : "translate-x-0.5")} />
                </div>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-[#F0EEF5]">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-[#6B6B6B]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#151515]">Language</p>
                    <p className="text-xs text-[#9B9B9B]">English (US)</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#BCBCBC]" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
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
        );
      case "Security":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-[#151515]">Privacy & Security</h2>
            <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden">
              <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-[#F0EEF5]">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-[#6B6B6B]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#151515]">Privacy Settings</p>
                    <p className="text-xs text-[#9B9B9B]">Control your data</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#BCBCBC]" />
              </button>
              <button onClick={handleClearHistory} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Trash2 size={18} className="text-red-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-500">Clear All History</p>
                    <p className="text-xs text-[#9B9B9B]">Delete all conversations</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#BCBCBC]" />
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-xl font-medium">{activeTab} Content</h2>
            <p className="text-sm">This section is under development.</p>
          </div>
        );
    }
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoutConfirmOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[900px] w-[95vw] h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-4xl"
      >
        <div className="flex h-full bg-[#F7F7F7]">
          {/* Sidebar */}
          <aside className="w-14 sm:w-55 border-r border-gray-100 flex flex-col py-4 px-2 sm:px-3">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-[#151515] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-0.5">
              {filteredSidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 sm:px-3 py-2 rounded-lg text-[14px] font-medium transition-all",
                    activeTab === item.id
                      ? "bg-gray-100 text-[#101828]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#101828]",
                  )}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout button at bottom of sidebar */}
            <button
              onClick={handleLogoutClick}
              className="mt-auto w-full flex items-center gap-3 px-2 sm:px-3 py-2 rounded-lg text-[14px] font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </aside>

          {/* Content Area */}
          <main className="flex-1 flex flex-col m-1 rounded-4xl bg-white shadow-xl min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-5 sm:p-8">{renderContent()}</div>
            </ScrollArea>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
