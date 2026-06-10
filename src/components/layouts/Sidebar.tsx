"use client";

import { ChevronDown, MoreHorizontal, Trash2, Rocket, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { getChatUserId } from "@/lib/chatApi";
import { getCloudConversations, saveCloudConversation, deleteCloudConversation } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
function ConversationItem({ conv }: { conv: Conversation }) {
  const [activeId, setActiveId] = useAtom(activeConversationIdAtom);
  const [conversations, setConversations] = useAtom(conversationsAtom);
  const [authUser] = useAtom(userAtom);
  const setSidebarOpen = useSetAtom(sidebarOpenAtom);
  const router = useRouter();
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const isActive = activeId === conv.id;
  const userId = getChatUserId(authUser);

  const handleClick = () => {
    if (!isAssessmentComplete) return;
    setActiveId(conv.id);
    // Assessment conversations live at /chat, not /chat/:id
    if (conv.id.startsWith("assessment-")) {
      router.push("/chat");
    } else {
      router.push(`/chat/${conv.id}`);
    }
    setSidebarOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAssessmentComplete) return;
    setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    if (activeId === conv.id) {
      setActiveId(null);
      router.push("/dna");
    }
    try { localStorage.removeItem(`direction_chat_${userId}_${conv.id}`); } catch {}
    try { localStorage.removeItem(`dna_chat_${userId}_${conv.id}`); } catch {}
    try { localStorage.removeItem(`execution_chat_${userId}_${conv.id}`); } catch {}
    if (authUser?.uid) deleteCloudConversation(authUser.uid, conv.id).catch(() => {});
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

function sortConvos(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const timeA = new Date(a.updatedAt).getTime();
    const timeB = new Date(b.updatedAt).getTime();
    if (timeA !== timeB) return timeB - timeA;
    return (b.id || "").localeCompare(a.id || "");
  });
}

// Gather every locally-stored conversation for a user, independent of the
// backend history API (which may be unavailable). Sources:
//  - convos_<uid>            : the full persisted snapshot
//  - dna_chat_<uid>_*        : local-only DNA chats
//  - direction_chat_<uid>_*  : local-only direction chats
//  - assessment_conv_<uid>   : the assessment conversation
function loadLocalConversations(uid: string): Conversation[] {
  const out: Conversation[] = [];
  const seen = new Set<string>();
  const push = (c: Conversation | null | undefined) => {
    if (!c?.id || seen.has(c.id)) return;
    seen.add(c.id);
    out.push({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) });
  };

  // Read for a given owner suffix. We read BOTH the real uid AND "local",
  // because chat components fall back to a "local" key when the user atom
  // isn't populated yet at save time (a race). Without this, those chats were
  // written but never shown — the most common cause of "history disappeared".
  const owners = [uid, "local"];

  for (const owner of owners) {
    try {
      const stored = localStorage.getItem(`convos_${owner}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        if (Array.isArray(parsed)) parsed.forEach(push);
      }
    } catch {}

    try {
      const stored = localStorage.getItem(`assessment_conv_${owner}`);
      if (stored) push(JSON.parse(stored));
    } catch {}
  }

  try {
    Object.keys(localStorage)
      .filter((k) =>
        k.startsWith(`dna_chat_${uid}_`) || k.startsWith(`dna_chat_local_`) ||
        k.startsWith(`direction_chat_${uid}_`) || k.startsWith(`direction_chat_local_`) ||
        k.startsWith(`execution_chat_${uid}_`) || k.startsWith(`execution_chat_local_`),
      )
      .forEach((k) => {
        try { push(JSON.parse(localStorage.getItem(k)!)); } catch {}
      });
  } catch {}

  return sortConvos(out);
}

interface SidebarProps {
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Detects users whose firstName was captured as an affirmative ("yes", "ok", etc.)
// or whose profile is missing a last name after completing the assessment.
const AFFIRMATIVE_RE = /^(yes|yeah|yep|yup|correct|right|ok|okay|sure|no|nope|👍|✓)$/i;
function isProfileStale(authUser: ReturnType<typeof useAtomValue<typeof userAtom>>): boolean {
  if (!authUser?.profile?.dnaAssessmentComplete) return false;
  const fn = (authUser.profile.firstName || "").trim();
  if (!fn || AFFIRMATIVE_RE.test(fn)) return true;
  if (!authUser.profile.lastName) return true;
  return false;
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

  const convoStorageKey = authUser?.uid ? `convos_${authUser.uid}` : null;

  // Restore conversations from localStorage on login — independent of the
  // backend history API, so chats survive refresh/login even when it's down.
  useEffect(() => {
    if (!authUser?.uid) {
      setConversations([]);
      // Clear any leftover storage (logout case handled by uid change)
      return;
    }
    const local = loadLocalConversations(authUser.uid);
    if (local.length > 0) {
      setConversations((prev) => {
        const merged = [...prev];
        local.forEach((lc) => {
          if (!merged.find((m) => m.id === lc.id)) merged.push(lc);
        });
        return sortConvos(merged);
      });
    }

    // Pull cross-device history from the cloud and merge it in. This is what
    // makes assessment/DNA/Direction chats follow the user to a new device.
    const uid = authUser.uid;
    getCloudConversations(uid)
      .then((cloud) => {
        if (cloud.length === 0) return;
        setConversations((prev) => {
          const merged = [...prev];
          cloud.forEach((cc) => {
            const idx = merged.findIndex((m) => m.id === cc.id);
            if (idx === -1) merged.push(cc);
            // Prefer the version with more messages (a fuller copy).
            else if ((cc.messages?.length || 0) > (merged[idx].messages?.length || 0)) merged[idx] = cc;
          });
          return sortConvos(merged);
        });
      })
      .catch(() => {});
  }, [authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // When assessment completes, force-reload from localStorage so the
  // assessment conversation appears in the sidebar immediately.
  useEffect(() => {
    if (!isAssessmentComplete || !authUser?.uid) return;
    const local = loadLocalConversations(authUser.uid);
    if (local.length > 0) {
      setConversations((prev) => {
        const merged = [...prev];
        local.forEach((lc) => {
          if (!merged.find((m) => m.id === lc.id)) merged.push(lc);
        });
        return sortConvos(merged);
      });
    }
  }, [isAssessmentComplete, authUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // GUARANTEE the assessment conversation is always shown for anyone who has
  // completed it — independent of the backend history API (which never stores
  // these local-only chats and may be empty/slow). This is the single source
  // of truth for assessment history and must NOT be coupled to convoData; that
  // coupling is what kept regressing whenever the chat query changed.
  useEffect(() => {
    if (!authUser?.uid) return;
    const uid = authUser.uid;

    let conv: Conversation | null = null;
    try {
      const stored = localStorage.getItem(`assessment_conv_${uid}`)
        || localStorage.getItem(`assessment_conv_local`);
      if (stored) conv = JSON.parse(stored);
    } catch {}

    // Existing users who finished the assessment before it was persisted
    // locally (or on another device) still get a clickable history entry.
    if (!conv && authUser.profile?.dnaAssessmentComplete) {
      conv = {
        id: `assessment-${uid}`,
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

    if (!conv) return;
    const assessmentConv = conv;
    setConversations((prev) => {
      if (prev.some((c) => c.id === assessmentConv.id || c.segment === "assessment")) {
        return prev;
      }
      return sortConvos([...prev, assessmentConv]);
    });
  }, [authUser?.uid, authUser?.profile?.dnaAssessmentComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist conversations to localStorage whenever they change
  useEffect(() => {
    if (!convoStorageKey || conversations.length === 0) return;
    try {
      localStorage.setItem(convoStorageKey, JSON.stringify(conversations));
    } catch {}
  }, [conversations, convoStorageKey]);

  // Mirror local-only conversations (assessment/DNA/Direction) to Firestore so
  // history follows the user across devices. Debounced, and we only write the
  // ones whose content actually changed since the last sync to bound writes.
  const cloudSyncedRef = useRef<Record<string, string>>({});
  useEffect(() => {
    const uid = authUser?.uid;
    if (!uid || conversations.length === 0) return;
    const timer = setTimeout(() => {
      for (const conv of conversations) {
        // Backend chats already sync via the history API — only mirror local ones.
        if (conv.isCreatedOnBackend !== false) continue;
        let serialized = "";
        try { serialized = JSON.stringify(conv); } catch { continue; }
        if (cloudSyncedRef.current[conv.id] === serialized) continue;
        cloudSyncedRef.current[conv.id] = serialized;
        saveCloudConversation(uid, conv).catch(() => {
          // Allow a retry on the next change if the write failed.
          delete cloudSyncedRef.current[conv.id];
        });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [conversations, authUser?.uid]);


  const openSettings = (tab: string) => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        try { localStorage.removeItem("sorene_last_route"); } catch {}
        window.location.href = "/";
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

  let navItems: { icon: string | null; lucideIcon?: React.ReactNode; label: string; action?: () => void; path?: string }[] = [
    {
      icon: "/figmaAssets/dna.svg",
      label: "Your DNA",
      path: "/dna",
    },
    {
      icon: "/figmaAssets/compass.svg",
      label: "Your DIRECTION",
      action: () => {
        localStorage.removeItem("rcGenerationRequested");
        router.push("/direction");
        if (mobile) setSidebarOpen(false);
      },
    },
    {
      icon: null,
      lucideIcon: <Rocket size={20} className="text-[#151515] transition-all duration-200 group-hover:scale-110" />,
      label: "Execution Hub",
      path: "/execution-hub",
    },
    {
      icon: "/figmaAssets/lightbulb.svg",
      label: "Education",
      path: "/education",
    },
    {
      icon: null,
      lucideIcon: <Layers size={20} className="text-[#151515] transition-all duration-200 group-hover:scale-110" />,
      label: "Other",
      path: "/other",
    },
  ];

  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <motion.div
      layout
      className={cn(
        "flex flex-col h-full w-full z-50 relative lg:bg-transparent bg-white",
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

      {/* Your Sorene Assistant — nav button + conversation list */}
      <div className={cn("px-2 shrink-0", collapsed && "px-3")}>
        <button
          data-testid="nav-new-chat"
          disabled={!isAssessmentComplete}
          onClick={() => {
            if (!isAssessmentComplete) return;
            setActiveId(null);
            router.push("/chat");
            if (mobile) setSidebarOpen(false);
          }}
          className={cn(
            "text-label-medium w-full flex items-center rounded-xl transition-all duration-200 text-left group px-2 h-14 text-[#151515]",
            pathname === "/chat" ? "bg-[#ECEDEE]" : "",
            !isAssessmentComplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          )}
          title={collapsed ? "Your Sorene Assistant" : undefined}
        >
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img
              src="/figmaAssets/chat-start.svg"
              alt="Your Sorene Assistant"
              className="w-5 h-5 transition-all duration-200 group-hover:scale-110"
            />
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
                Your Sorene Assistant
              </motion.span>
            )}
          </AnimatePresence>
        </button>
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

            {/* Execution Section */}
            {conversations.filter((c) => c.segment === "execution").length > 0 && (
              <div className="mb-4">
                <p className="text-label-medium text-[#62646A] uppercase tracking-widest px-3 mb-1">
                  EXECUTION
                </p>
                <div className="space-y-0.5">
                  {conversations
                    .filter((c) => c.segment === "execution")
                    .map((conv) => (
                      <ConversationItem key={conv.id} conv={conv} />
                    ))}
                </div>
              </div>
            )}

            {/* Education Section */}
            {conversations.filter((c) => c.segment === "education").length > 0 && (
              <div className="mb-4">
                <p className="text-label-medium text-[#62646A] uppercase tracking-widest px-3 mb-1">
                  EDUCATION
                </p>
                <div className="space-y-0.5">
                  {conversations
                    .filter((c) => c.segment === "education")
                    .map((conv) => (
                      <ConversationItem key={conv.id} conv={conv} />
                    ))}
                </div>
              </div>
            )}

            {/* Empty state — confirms the list is rendering, just has nothing yet */}
            {conversations.length === 0 && (
              <p className="px-3 mt-2 text-[12px] leading-5 text-[#9A9A9A]">
                No conversations yet. Your assessment and chats in DNA,
                Direction and Execution will appear here.
              </p>
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
          onClick={() => { setSettingsTab("General"); setIsSettingsOpen(true); }}
          data-testid="user-profile-trigger"
          className={cn(
            "w-full flex items-center rounded-xl transition-colors group outline-none hover:bg-black/5 cursor-pointer text-left",
            collapsed ? "justify-center p-2" : "gap-2 px-3 py-2",
          )}
        >
          {/* Avatar with stale-profile dot indicator */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "rounded-full overflow-hidden bg-[#3D3D3D] flex items-center justify-center transition-all duration-200 group-hover:ring-2 ring-black/5",
                collapsed ? "w-10 h-10" : "w-8 h-8",
              )}
            >
              {authUser?.profile?.photoUrl ? (
                <img
                  src={authUser.profile.photoUrl}
                  alt={authUser?.displayName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {(authUser?.profile?.firstName || authUser?.displayName || authUser?.email || authUser?.uid || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isProfileStale(authUser) && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white" />
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
              >
                <div className="flex-1 min-w-0">
                  {isProfileStale(authUser) ? (
                    <>
                      <p className="text-label-medium text-orange-500 truncate">Update your name →</p>
                      <p className="text-body-xsmall text-[#62646A] truncate">
                        {authUser?.profile?.email || authUser?.email || authUser?.uid || ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-label-medium text-[#151515] truncate">
                        {authUser?.profile
                          ? `${authUser.profile.firstName} ${authUser.profile.lastName}`.trim() || authUser.displayName || "User"
                          : authUser?.displayName || "User"}
                      </p>
                      <p className="text-body-xsmall text-[#62646A] truncate">
                        {authUser?.profile?.email || authUser?.email || authUser?.uid || ""}
                      </p>
                    </>
                  )}
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
