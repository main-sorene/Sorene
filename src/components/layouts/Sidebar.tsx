"use client";

import { ChevronDown, MoreHorizontal, Trash2, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Conversation,
  activeConversationIdAtom,
  conversationsAtom,
  sidebarOpenAtom,
  userAtom,
  isSettingsOpenAtom,
  isLogoutConfirmOpenAtom,
  settingsTabAtom,
  isAssessmentCompleteAtom,
} from "@/store/atoms";
import { motion, AnimatePresence } from "framer-motion";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtom, useSetAtom, useAtomValue } from "jotai";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { deleteHistory, getChatUserId, getConvoHistory } from "@/lib/chatApi";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
function ConversationItem({ conv }: { conv: Conversation }) {
  const [activeId, setActiveId] = useAtom(activeConversationIdAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [authUser] = useAtom(userAtom);
  const setSidebarOpen = useSetAtom(sidebarOpenAtom);
  const router = useRouter();
  const { toast } = useToast();
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const isActive = activeId === conv.id;
  const userId = getChatUserId(authUser);

  const deleteHistoryMutation = useMutation({
    mutationFn: async (chatId: string) => deleteHistory({ userId, chatId }),
  });

  const handleClick = () => {
    if (!isAssessmentComplete) return;
    setActiveId(conv.id);
    router.push(`/chat/${conv.id}`);
    setSidebarOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAssessmentComplete) return;
    const previousConversations = conversations;
    setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    if (activeId === conv.id) {
      setActiveId(null);
      router.push("/chat");
    }
    try {
      await deleteHistoryMutation.mutateAsync(conv.id);
    } catch (error) {
      setConversations(previousConversations);
      toast({
        title: "Could not delete chat",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      layout
      initial={false}
      data-testid={`conversation-item-${conv.id}`}
      onClick={handleClick}
      className={cn(
        "text-label-medium group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-[#151515]",
        isActive ? "bg-[#ECEDEE]" : "",
        !isAssessmentComplete
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer",
      )}
    >
      <p className="text-[13px] truncate leading-5 flex-1">
        {conv.title.length > 25
          ? `${conv.title.substring(0, 25)}...`
          : conv.title}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            data-testid={`conversation-menu-${conv.id}`}
            disabled={!isAssessmentComplete}
            className={cn(
              "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 shrink-0 ring-0 hover:ring-0 outline-0 hover:outline-0",
              !isAssessmentComplete && "cursor-not-allowed",
            )}
          >
            <MoreHorizontal size={13} className="text-black" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 bg-[#F7F7F7]">
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={handleDelete}
          >
            <Trash2 size={13} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

interface SidebarProps {
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  mobile = false,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations] = useAtom(conversationsAtom);
  const [authUser] = useAtom(userAtom);
  const setSidebarOpen = useSetAtom(sidebarOpenAtom);
  const setActiveId = useSetAtom(activeConversationIdAtom);
  const { toast } = useToast();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const setSettingsTab = useSetAtom(settingsTabAtom);
  const setIsLogoutConfirmOpen = useSetAtom(isLogoutConfirmOpenAtom);
  const setConversations = useSetAtom(conversationsAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const userId = getChatUserId(authUser);

  const { data: convoData, refetch: refetchConvo } = useQuery({
    queryKey: ["chat", "convo", userId],
    queryFn: () => getConvoHistory(userId),
    enabled: Boolean(authUser?.uid),
  });

  // Handle refetch after login and clear history on logout
  useEffect(() => {
    if (authUser?.uid) {
      // Clear existing conversations immediately when user ID changes
      // to prevent showing previous user's chats while loading.
      setConversations([]);
      refetchConvo();
    } else if (!authUser) {
      setConversations([]);
    }
  }, [authUser?.uid, authUser, refetchConvo, setConversations]);

  useEffect(() => {
    if (!convoData?.chats) return;

    setConversations((prev) => {
      // Restore persisted assessment conversation from localStorage
      let assessmentConv: Conversation | null = null;
      try {
        const stored = localStorage.getItem(`assessment_conv_${authUser?.uid || "local"}`);
        if (stored) {
          assessmentConv = JSON.parse(stored);
        } else if (authUser?.profile?.dnaAssessmentComplete) {
          // Fallback for users who completed assessment before localStorage was added
          assessmentConv = {
            id: `assessment-${authUser.uid || "local"}`,
            title: "User Assessment Phase",
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            model: "sorene-1",
            done: true,
            segment: "assessment",
            isCreatedOnBackend: false,
          };
        }
      } catch {}

      const newConvs: Conversation[] = convoData.chats.map((item, index) => {
        const id = item.chat_id;
        const existing = prev.find((c) => c.id === id);
        if (existing) {
          return {
            ...existing,
            segment: item.segment,
            title: item.message,
          };
        }

        return {
          id,
          title: item.message,
          segment: item.segment,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(Date.now() - index * 1000), // Slightly spread to preserve backend order
          model: "sorene-1",
          isCreatedOnBackend: true,
        };
      });

      // Restore DNA chat conversations from localStorage
      const dnaChatConvs: Conversation[] = [];
      try {
        const uidKey = authUser?.uid || "local";
        Object.keys(localStorage)
          .filter((k) => k.startsWith(`dna_chat_${uidKey}_`))
          .forEach((k) => {
            try {
              const c = JSON.parse(localStorage.getItem(k)!);
              if (c?.id) dnaChatConvs.push(c);
            } catch {}
          });
      } catch {}

      // Merge backend data + assessment conv + DNA chats + existing local-only chats
      const merged = [...newConvs];
      prev.forEach((pc) => {
        if (!merged.find((m) => m.id === pc.id)) {
          merged.push(pc);
        }
      });
      if (assessmentConv && !merged.find((m) => m.id === assessmentConv!.id)) {
        merged.push(assessmentConv);
      }
      dnaChatConvs.forEach((dc) => {
        if (!merged.find((m) => m.id === dc.id)) {
          merged.push(dc);
        }
      });

      return merged.sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || "").localeCompare(a.id || "");
      });
    });
  }, [convoData, setConversations]);

  const openSettings = (tab: string) => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (user: any) => {
    const name = user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user?.displayName || user?.email || "User";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleNewChat = () => {
    setActiveId(null);
    router.push("/chat");
    if (mobile) setSidebarOpen(false);
  };

  // DNA/DIRECTION logic will be applied later.
  // For now, all conversations will be under "Your chats" section.

  let navItems: { icon: string | null; lucideIcon?: React.ReactNode; label: string; action?: () => void; path?: string }[] = [
    {
      icon: "/figmaAssets/note-pencil.svg",
      label: "New chat",
      action: handleNewChat,
      path: "/chat",
    },
    {
      icon: "/figmaAssets/dna.svg",
      label: "Your DNA",
      path: "/dna",
    },
    {
      icon: "/figmaAssets/compass.svg",
      label: "Your DIRECTION",
      path: "/direction",
    },
    {
      icon: null,
      lucideIcon: <Rocket size={20} className="text-[#151515] transition-all duration-200 group-hover:scale-110" />,
      label: "Execution Hub",
      path: "/execution-hub",
    },
  ];

  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <motion.div
      layout
      className={cn(
        "flex flex-col h-full w-full  z-1 relative lg:bg-transparent bg-white",
        mobile ? "shadow-2xl h-screen overflow-hidden" : "",
      )}
    >
      <div className="flex items-center px-[24px] py-[16px] shrink-0 min-h-[96px] relative">
        <div
          className="w-12 h-12 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5 cursor-pointer"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={() => {
            if (collapsed && onToggleCollapse) {
              onToggleCollapse();
            }
          }}
        >
          {collapsed && isLogoHovered ? (
            <img
              src="/figmaAssets/sidebar.svg"
              alt="Toggle Sidebar"
              className="w-7 h-7"
            />
          ) : (
            <img
              src="/figmaAssets/vector-1.svg"
              alt="Sorene logo"
              className="w-10 h-10"
            />
          )}
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-4"
            >
              <button
                data-testid="sidebar-collapse"
                onClick={onToggleCollapse || (() => setSidebarOpen(false))}
                className="p-2 rounded-lg hover:bg-black/5 transition-colors text-black/50 hover:text-black"
              >
                <img
                  src="/figmaAssets/sidebar.svg"
                  alt="Collapse"
                  className="w-7 h-7"
                />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <div className={cn("px-2 shrink-0", collapsed && "px-3")}>
        {navItems.map((item) => {
          const isActive = item.path ? pathname === item.path : false;
          return (
            <button
              key={item.label}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              disabled={!isAssessmentComplete}
              onClick={() => {
                if (!isAssessmentComplete) return;
                if (item.action) item.action();
                else if (item.path) {
                  router.push(item.path);
                  if (mobile) setSidebarOpen(false);
                }
              }}
              className={cn(
                "text-label-medium w-full flex items-center rounded-xl transition-all duration-200 text-left group px-2 h-14 text-[#151515]",
                isActive ? "bg-[#ECEDEE]" : "",
                !isAssessmentComplete
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer",
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                {item.lucideIcon ?? (
                  <img
                    src={item.icon!}
                    alt={item.label}
                    className="w-5 h-5 transition-all duration-200 group-hover:scale-110"
                  />
                )}
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="whitespace-nowrap overflow-hidden text-[14px] font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Scrollable conversation sections */}
      {!collapsed && (
        <ScrollArea className="flex-1 mt-4">
          <div className="px-2">
            {/* DNA Section */}
            {conversations.filter((c) => c.segment === "dna").length > 0 && (
              <div className="mb-4">
                <p className="text-label-medium text-[#62646A] uppercase tracking-widest px-3 mb-1">
                  DNA
                </p>
                <div className="space-y-0.5">
                  {conversations
                    .filter((c) => c.segment === "dna")
                    .map((conv) => (
                      <ConversationItem key={conv.id} conv={conv} />
                    ))}
                </div>
              </div>
            )}

            {/* Direction Section */}
            {conversations.filter((c) => c.segment === "ideation").length >
              0 && (
              <div className="mb-4">
                <p className="text-label-medium text-[#62646A] uppercase tracking-widest px-3 mb-1">
                  DIRECTION
                </p>
                <div className="space-y-0.5">
                  {conversations
                    .filter((c) => c.segment === "ideation")
                    .map((conv) => (
                      <ConversationItem key={conv.id} conv={conv} />
                    ))}
                </div>
              </div>
            )}

            {/* Other Section */}
            {conversations.filter(
              (c) => !["dna", "ideation"].includes(c.segment || ""),
            ).length > 0 && (
              <div className="mb-4">
                <p className="text-label-medium text-[#62646A] uppercase tracking-widest px-3 mb-1">
                  Others
                </p>
                <div className="space-y-0.5">
                  {conversations
                    .filter(
                      (c) => !["dna", "ideation"].includes(c.segment || ""),
                    )
                    .map((conv) => (
                      <ConversationItem key={conv.id} conv={conv} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* spacer if collapsed */}
      {collapsed && <div className="flex-1" />}

      {!collapsed && (
        <div className="px-2 mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/upgrade")}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-label-medium text-[#151515] transition-colors hover:bg-[#ECEDEE] cursor-pointer group text-left"
          >
            <img
              src="/figmaAssets/starfour.svg"
              className="w-6 h-6 transition-transform group-hover:scale-110"
              alt="Upgrade"
            />
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Upgrade icon if collapsed */}
      {collapsed && (
        <div className="px-2 mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/upgrade")}
            className="p-3 rounded-xl text-black/70 transition-all duration-200 group hover:bg-black/5 hover:text-black cursor-pointer"
            title="Upgrade Plan"
          >
            <img
              src="/figmaAssets/starfour.svg"
              className="w-6 h-6 transition-transform group-hover:scale-110"
              alt="Upgrade"
            />
          </button>
        </div>
      )}

      <div className="shrink-0 border-t border-black/5 px-2 py-3">
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          data-testid="user-profile-trigger"
          className={cn(
            "w-full flex items-center rounded-xl transition-colors group outline-none hover:bg-black/5 cursor-pointer text-left",
            collapsed ? "justify-center p-2" : "gap-2 px-3 py-2",
          )}
        >
          <img
            src={
              authUser?.profile?.photoUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.displayName || "User"}`
            }
            alt={authUser?.displayName || "User"}
            className={cn(
              "rounded-full shrink-0 bg-purple-100 transition-all duration-200 group-hover:ring-2 ring-black/5",
              collapsed ? "w-10 h-10" : "w-8 h-8",
            )}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-label-medium text-[#151515] truncate">
                    {authUser?.profile
                      ? `${authUser.profile.firstName} ${authUser.profile.lastName}`
                      : authUser?.displayName || "User"}
                  </p>
                  <p className="text-body-xsmall text-[#62646A] truncate">
                    {authUser?.profile?.email || "No email"}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className="text-black/40 flex-shrink-0"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
}

function SoreneMark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        fill="white"
      />
    </svg>
  );
}
