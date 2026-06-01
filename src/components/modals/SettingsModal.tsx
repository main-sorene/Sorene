"use client";

import * as React from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  isSettingsOpenAtom,
  settingsTabAtom,
  isLogoutConfirmOpenAtom,
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
} from "lucide-react";
import { SubscriptionContent } from "@/components/settings/SubscriptionContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

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
    label: "Security",
  },
];

export function SettingsModal() {
  const [isOpen, setIsOpen] = useAtom(isSettingsOpenAtom);
  const [activeTab, setActiveTab] = useAtom(settingsTabAtom);
  const setLogoutConfirmOpen = useSetAtom(isLogoutConfirmOpenAtom);
  const { data: subscription } = useSubscriptionStatus();

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
