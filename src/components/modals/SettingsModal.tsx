"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  Loader2,
  Plug,
  CreditCard,
  BarChart2,
  Database,
  Lock,
  LogOut,
  X,
  Check,
  AlertTriangle,
  Camera,
  ChevronDown,
  Zap,
} from "lucide-react";
import { SubscriptionContent } from "@/components/settings/SubscriptionContent";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { saveUserProfile, deleteUserProfile, clearCloudConversations } from "@/lib/firestore";
import { authFetch } from "@/lib/authFetch";

const SIDEBAR_ITEMS = [
  { id: "General", icon: Settings, label: "General" },
  { id: "Account", icon: User, label: "Account" },
  { id: "Billing", icon: CreditCard, label: "Billing" },
  { id: "Usage", icon: BarChart2, label: "Usage" },
  { id: "Preferences", icon: Wrench, label: "Preferences" },
  { id: "Notifications", icon: Bell, label: "Notifications" },
  { id: "Integrations", icon: Plug, label: "Integrations" },
  { id: "Data control", icon: Database, label: "Data control" },
  { id: "Security", icon: Lock, label: "Privacy & Security" },
];

const GENDER_OPTIONS = ["Male", "Female"];

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Birthday may be stored as DD/MM/YYYY (assessment), MM/DD/YYYY (old), or YYYY-MM-DD (ISO).
// <input type="date"> needs YYYY-MM-DD. We store as YYYY-MM-DD on save.
function birthdayToInputValue(birthday: string): string {
  if (!birthday) return "";
  // Already ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return birthday;
  const parts = birthday.split("/");
  if (parts.length !== 3) return "";
  const [a, b, y] = parts;
  if (!y || y.length !== 4) return "";
  const ai = parseInt(a, 10);
  const bi = parseInt(b, 10);
  // If first segment > 12 it must be the day (DD/MM/YYYY — assessment format)
  // If second segment > 12 it must be the day (MM/DD/YYYY — legacy format)
  // If both ≤ 12, assume DD/MM/YYYY since that's what the assessment collects
  if (ai > 12) {
    // DD/MM/YYYY
    return `${y}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  if (bi > 12) {
    // MM/DD/YYYY
    return `${y}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }
  // Ambiguous — default to DD/MM/YYYY (assessment stores this)
  return `${y}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
}

function inputValueToBirthday(value: string): string {
  // Store as ISO YYYY-MM-DD to avoid format ambiguity
  return value || "";
}

function generateOrgId(uid: string): string {
  const hash = uid.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  return `ORG-${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}`;
}

const BG_QUESTION_LABELS: Record<string, string> = {
  bg1_history: "Current / most recent role",
  bg2_skills: "Years of experience & industries",
  bg3_pattern: "Core expertise",
  bg4_direction: "Key skills & tools",
  bg5_turning: "Career path",
};

function renderSummaryText(text: string) {
  return text.split(/\n\n+/).map((para, pi) => (
    <p key={pi} className="text-sm text-[#151515] leading-relaxed mb-3 last:mb-0">
      {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
      )}
    </p>
  ));
}

function ProfessionalExperienceSection({ authUser }: { authUser: ReturnType<typeof useAtomValue<typeof userAtom>> }) {
  const setUser = useSetAtom(userAtom);
  const { toast } = useToast();
  const [isUploadingCv, setIsUploadingCv] = React.useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = React.useState(false);
  const hasTriedGenRef = React.useRef(false);
  const cvInputRef = React.useRef<HTMLInputElement>(null);

  const assessmentAnswers = (authUser?.profile as any)?.assessmentAnswers as Record<string, string> | undefined;
  const cvSummary = (authUser?.profile as any)?.cvSummary as string | undefined;
  const hasBgAnswers = assessmentAnswers
    ? Object.keys(BG_QUESTION_LABELS).some((k) => assessmentAnswers[k])
    : false;

  // Auto-generate polished summary for existing users who have bg answers but no summary yet
  React.useEffect(() => {
    if (cvSummary || !hasBgAnswers || !authUser?.uid || hasTriedGenRef.current) return;
    hasTriedGenRef.current = true;
    setIsGeneratingSummary(true);
    import("@/lib/authFetch").then(({ authFetch: af }) =>
      af("/api/bg-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: assessmentAnswers }),
      })
        .then((r) => r.json())
        .then(async (data) => {
          const summary = (data?.summary || "").trim();
          if (!summary) return;
          const { saveUserProfile: svp } = await import("@/lib/firestore");
          await svp(authUser!.uid, { cvSummary: summary } as any);
          setUser({ ...authUser!, profile: { ...(authUser!.profile as any), cvSummary: summary } });
        })
        .catch(() => {})
        .finally(() => setIsGeneratingSummary(false))
    );
  }, [authUser?.uid, hasBgAnswers, cvSummary]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.uid) return;
    setIsUploadingCv(true);
    try {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const fileBase64 = btoa(binary);
      const { authFetch: af } = await import("@/lib/authFetch");
      const res = await af("/api/cv-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64, mimeType: file.type }),
      });
      let summary = "";
      if (res.ok) {
        const data = await res.json();
        summary = (data?.summary || "").trim();
      }
      const cvDataPayload = { file_name: file.name, file_path: "", status: "uploaded", text_length: file.size };
      const { saveUserProfile: svp } = await import("@/lib/firestore");
      await svp(authUser.uid, { cvData: cvDataPayload, ...(summary ? { cvSummary: summary } : {}) } as any);
      setUser({
        ...authUser,
        profile: { ...(authUser.profile as any), cvData: cvDataPayload, ...(summary ? { cvSummary: summary } : {}) },
      });
      toast({ description: "CV uploaded successfully." });
    } catch {
      toast({ description: "Failed to upload CV.", variant: "destructive" });
    } finally {
      setIsUploadingCv(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3 block">Professional Experience</label>

      {/* CV upload row */}
      <div className="mb-4">
        {authUser?.profile?.cvData?.file_name ? (
          <div className="rounded-xl border border-[#ECEDEE] px-4 py-3 flex items-center gap-3">
            <img src="/figmaAssets/FilePdf.svg" alt="PDF" className="w-8 h-8" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#151515] truncate">{authUser.profile.cvData.file_name}</p>
              <p className="text-xs text-[#9B9B9B]">CV on file</p>
            </div>
            <button
              onClick={() => cvInputRef.current?.click()}
              disabled={isUploadingCv}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium shrink-0"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            onClick={() => cvInputRef.current?.click()}
            disabled={isUploadingCv}
            className="w-full rounded-xl border border-dashed border-[#D0D0D0] px-4 py-4 text-center hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
          >
            <p className="text-sm text-[#62646A] font-medium">{isUploadingCv ? "Uploading…" : "Upload your CV or portfolio"}</p>
            <p className="text-xs text-[#9B9B9B] mt-1">PDF • helps Sorene understand your background</p>
          </button>
        )}
        <input ref={cvInputRef} type="file" accept=".pdf,application/pdf" onChange={handleCvUpload} className="hidden" />
      </div>

      {/* Polished narrative summary */}
      {cvSummary ? (
        <div className="rounded-xl border border-[#ECEDEE] bg-[#FAFAFA] px-5 py-4">
          {renderSummaryText(cvSummary)}
        </div>
      ) : isGeneratingSummary ? (
        <div className="flex items-center gap-2 text-xs text-[#9B9B9B] py-2">
          <Loader2 size={13} className="animate-spin" />
          Summarising your background…
        </div>
      ) : !hasBgAnswers && !authUser?.profile?.cvData?.file_name ? (
        <p className="text-xs text-[#BCBCBC] mt-1">Your experience summary from the assessment will appear here.</p>
      ) : null}
    </div>
  );
}

export function SettingsModal() {
  const [isOpen, setIsOpen] = useAtom(isSettingsOpenAtom);
  const [activeTab, setActiveTab] = useAtom(settingsTabAtom);
  const { data: subscription, refetch: refetchSubscription } = useSubscriptionStatus();
  const setConversations = useSetAtom(conversationsAtom);
  const setIsAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const [, setUser] = useAtom(userAtom);
  const authUser = useAtomValue(userAtom);
  const { toast } = useToast();
  const router = useRouter();
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  // General form state
  const [firstName, setFirstName] = React.useState(authUser?.profile?.firstName || "");
  const [lastName, setLastName] = React.useState(authUser?.profile?.lastName || "");
  const [birthday, setBirthday] = React.useState(authUser?.profile?.birthday || "");
  const [gender, setGender] = React.useState(authUser?.profile?.sex || "");
  const [genderDropdownOpen, setGenderDropdownOpen] = React.useState(false);
  const [nickname, setNickname] = React.useState(authUser?.profile?.nickname || "");
  const [isSavingGeneral, setIsSavingGeneral] = React.useState(false);
  const [savedGeneral, setSavedGeneral] = React.useState(false);
  const genderDropdownRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = React.useState(false);
  const [mobileView, setMobileView] = React.useState<"list" | "content">("list");
  React.useEffect(() => { setMounted(true); }, []);

  // Sync form state when user data changes
  React.useEffect(() => {
    if (authUser) {
      setFirstName(authUser.profile?.firstName || "");
      setLastName(authUser.profile?.lastName || "");
      setBirthday(authUser.profile?.birthday || "");
      setGender(authUser.profile?.sex || "");
      setNickname(authUser.profile?.nickname || "");
    }
  }, [authUser]);

  // Refetch fresh subscription/credit data whenever the Usage or Billing tab is opened
  React.useEffect(() => {
    if (activeTab === "Usage" || activeTab === "Billing") {
      refetchSubscription();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close gender dropdown on outside click
  React.useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(e.target as Node)) {
        setGenderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    setIsOpen(false);
    setShowClearConfirm(false);
    setShowDeleteConfirm(false);
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
    const uid = authUser?.uid;
    try {
      // Clear cross-device cloud history first, while still authenticated.
      if (uid) await clearCloudConversations(uid).catch(() => {});
      if (auth) await signOut(auth);
      setUser(null);
      setConversations([]);
      setIsAssessmentComplete(false);
      try {
        Object.keys(sessionStorage).filter(k => k.startsWith("assessment_state_")).forEach(k => sessionStorage.removeItem(k));
        Object.keys(localStorage).filter(k =>
          k.startsWith("assessment_conv_") ||
          k.startsWith("convos_") ||
          k.startsWith("dna_chat_") ||
          k.startsWith("direction_chat_") ||
          k === "resourcesConstraints" ||
          k === "recipeDirections" ||
          k === "hiddenDirectionIds"
        ).forEach(k => localStorage.removeItem(k));
      } catch {}
      if (uid) {
        saveUserProfile(uid, {
          onboardingComplete: false,
          dnaAssessmentComplete: false,
          assessmentAnswers: undefined,
          directionText: undefined,
          dnaScores: undefined,
        } as any).catch(() => {});
      }
      setShowClearConfirm(false);
      setIsOpen(false);
      router.push("/");
    } catch {
      toast({ description: "Failed to clear history.", variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const uid = authUser?.uid;
    try {
      // Delete server-side data (Firestore profile + messaging + Firebase Auth)
      await authFetch("/api/account/delete", { method: "POST" });
      if (uid) {
        await deleteUserProfile(uid).catch(() => {});
      }
      // Sign out client-side (auth user already deleted server-side)
      if (auth) await signOut(auth).catch(() => {});
      setUser(null);
      setConversations([]);
      setIsAssessmentComplete(false);
      // Clear ALL local storage data
      try {
        sessionStorage.clear();
        ["hiddenDirectionIds", "recipeDirections", "resourcesConstraints", "sorene_cookie_consent"].forEach(k => localStorage.removeItem(k));
        Object.keys(localStorage).filter(k =>
          k.startsWith("assessment_conv_") ||
          k.startsWith("convos_") ||
          k.startsWith("dna_chat_") ||
          k.startsWith("direction_chat_")
        ).forEach(k => localStorage.removeItem(k));
      } catch {}
      setShowDeleteConfirm(false);
      setIsOpen(false);
      window.location.href = "/";
    } catch {
      toast({ description: "Failed to delete account.", variant: "destructive" });
      setIsDeleting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.uid) return;

    if (!file.type.startsWith("image/")) {
      toast({ description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ description: "Image must be under 5MB.", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Resize to max 256x256 and convert to data URL — stored in Firestore, no Storage needed
      const dataUrl = await resizeImage(file, 256);
      await saveUserProfile(authUser.uid, { photoUrl: dataUrl });
      setUser({
        ...authUser,
        photoURL: dataUrl,
        profile: authUser.profile ? { ...authUser.profile, photoUrl: dataUrl } : undefined,
      });
      toast({ description: "Profile photo updated." });
    } catch {
      toast({ description: "Failed to upload photo.", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveGeneral = async () => {
    if (!authUser?.uid) return;
    setIsSavingGeneral(true);
    try {
      await saveUserProfile(authUser.uid, { firstName, lastName, birthday, sex: gender, nickname });
      setUser({
        ...authUser,
        displayName: `${firstName} ${lastName}`.trim() || authUser.displayName,
        profile: authUser.profile
          ? { ...authUser.profile, firstName, lastName, birthday, sex: gender, nickname }
          : undefined,
      });
      setSavedGeneral(true);
      setTimeout(() => setSavedGeneral(false), 3000);
    } catch {
      toast({ description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const filteredSidebarItems = SIDEBAR_ITEMS;

  const emailForDisplay = authUser?.profile?.email || authUser?.email || authUser?.uid || "";
  const displayName = [authUser?.profile?.firstName, authUser?.profile?.lastName].filter(Boolean).join(" ") || authUser?.displayName || emailForDisplay.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const email = authUser?.profile?.email || authUser?.email || authUser?.uid || "";
  const avatarUrl = authUser?.profile?.photoUrl;
  const orgId = authUser?.profile?.orgId || (authUser?.uid ? generateOrgId(authUser.uid) : "—");

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

    if (showDeleteConfirm) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 py-20">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-lg font-semibold text-[#151515] mb-2">Delete your account?</h2>
            <p className="text-sm text-[#62646A]">This will permanently delete all your data, conversations, DNA profile, and direction results. This action cannot be undone.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 rounded-xl border border-[#ECEDEE] text-sm font-medium text-[#151515] hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleDeleteAccount} disabled={isDeleting} className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60">
              {isDeleting ? "Deleting…" : "Yes, delete my account"}
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "General": {
        const AFFIRMATIVE_RE = /^(yes|yeah|yep|yup|correct|right|ok|okay|sure|no|nope|👍|✓)$/i;
        const firstNameLooksStale = AFFIRMATIVE_RE.test((authUser?.profile?.firstName || "").trim());
        const profileNeedsUpdate = (authUser?.profile as any)?.dnaAssessmentComplete &&
          (firstNameLooksStale || !authUser?.profile?.lastName);
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#151515]">General</h2>

            {/* Stale-profile nudge for users who completed assessment before name collection was added */}
            {profileNeedsUpdate && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex items-start gap-3">
                <span className="text-orange-400 mt-0.5 text-base leading-none">●</span>
                <div>
                  <p className="text-sm font-medium text-orange-700">Please update your name</p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    We weren't able to capture your full name during your assessment. Update it below and hit Save.
                  </p>
                </div>
              </div>
            )}

            {/* Profile card — avatar + full name */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">Profile Picture</p>
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover bg-purple-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-semibold">{initial}</div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Camera size={18} className="text-white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#151515] truncate">{displayName}</p>
                  <p className="text-sm text-[#62646A] truncate">{email}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors mt-1"
                  >
                    {isUploadingAvatar ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
                  </button>
                </div>
              </div>
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2 block">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-4 py-3 rounded-xl border border-[#ECEDEE] text-sm text-[#151515] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2 block">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-4 py-3 rounded-xl border border-[#ECEDEE] text-sm text-[#151515] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                />
              </div>
            </div>

            {/* Birthday */}
            <div>
              <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2 block">Birthday</label>
              <input
                type="date"
                value={birthdayToInputValue(birthday)}
                onChange={(e) => setBirthday(inputValueToBirthday(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-[#ECEDEE] text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              />
            </div>

            {/* Gender */}
            <div ref={genderDropdownRef} className="relative">
              <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2 block">Gender</label>
              <button
                onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#ECEDEE] text-sm text-left hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <span className={gender ? "text-[#151515] capitalize" : "text-[#9B9B9B]"}>
                  {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "Select gender"}
                </span>
                <ChevronDown size={16} className={cn("text-[#9B9B9B] transition-transform", genderDropdownOpen && "rotate-180")} />
              </button>
              {genderDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-[#ECEDEE] shadow-lg overflow-hidden">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setGender(opt.toLowerCase()); setGenderDropdownOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors flex items-center justify-between",
                        gender === opt.toLowerCase() && "bg-purple-50 text-purple-700",
                      )}
                    >
                      {opt}
                      {gender === opt.toLowerCase() && <Check size={14} className="text-purple-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Professional Experience */}
            <ProfessionalExperienceSection authUser={authUser} />

            {/* Nickname */}
            <div>
              <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2 block">What should Sorene call you?</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Mai, Boss, Captain"
                className="w-full px-4 py-3 rounded-xl border border-[#ECEDEE] text-sm text-[#151515] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
              />
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGeneral}
                disabled={isSavingGeneral}
                className="px-6 py-2.5 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {isSavingGeneral ? "Saving…" : "Save changes"}
              </button>
              {savedGeneral && (
                <span className="text-sm text-green-600 font-medium">Saved ✓</span>
              )}
            </div>
          </div>
        );
      }

      case "Account":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#151515]">Account</h2>

            {/* Organization ID */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2">Organization ID</p>
              <div className="rounded-xl border border-[#ECEDEE] px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-mono text-[#151515]">{orgId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(orgId);
                    toast({ description: "Organization ID copied." });
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Log out of all devices */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">Session</p>
              <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden divide-y divide-[#ECEDEE]">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-60"
                >
                  <LogOut size={16} className="text-[#151515]" />
                  <div>
                    <p className="text-sm font-medium text-[#151515]">{isLoggingOut ? "Logging out…" : "Log out of all devices"}</p>
                    <p className="text-xs text-[#9B9B9B]">Sign out from this and all other sessions</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">Danger Zone</p>
              <div className="rounded-2xl border border-red-200 overflow-hidden">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors text-left"
                >
                  <AlertTriangle size={16} className="text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-500">Delete your account</p>
                    <p className="text-xs text-[#9B9B9B]">Permanently delete all your data</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case "Billing":
        return <SubscriptionContent />;

      case "Usage": {
        const used = subscription?.credits?.used ?? 0;
        const limit = subscription?.credits?.limit ?? 250;
        const extra = subscription?.credits?.extra ?? 0;
        const resetAt = subscription?.credits?.resetAt;
        const plan = subscription?.plan ?? "free";
        const isFree = plan === "free";
        const effectiveLimit = limit + extra;
        const pct = effectiveLimit > 0 ? Math.min(100, Math.round((used / effectiveLimit) * 100)) : 0;
        const daysUntilReset = (!isFree && resetAt)
          ? Math.max(0, Math.ceil((resetAt - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;
        const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-[#111111]";

        // Plan tiers — proportional bar widths relative to Pro (max)
        const planTiers = [
          { id: "free", label: "Free", barWidth: "8%" },
          { id: "starter", label: "Starter", barWidth: "30%" },
          { id: "pro", label: "Professional", barWidth: "100%" },
        ];

        return (
          <div className="space-y-6">
            {/* Plan usage limits */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-4">
                Plan usage limits
              </p>
              <div className="space-y-3">
                {planTiers.map(({ id, label, barWidth }) => {
                  const isCurrentPlan = plan === id;
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm w-28 shrink-0",
                        isCurrentPlan ? "font-semibold text-[#151515]" : "text-[#9B9B9B]",
                      )}>
                        {label}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[#F0F0F0] overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", isCurrentPlan ? "bg-[#151515]" : "bg-[#D8D8D8]")}
                          style={{ width: barWidth }}
                        />
                      </div>
                      {isCurrentPlan && (
                        <span className="text-xs font-medium text-[#151515] shrink-0">Current</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current period usage */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-4">
                Current session
              </p>
              <div className="rounded-2xl border border-[#ECEDEE] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#151515] capitalize">
                    {isFree ? "Free" : plan === "pro" ? "Professional" : "Starter"} plan
                  </p>
                  <span className="text-sm font-semibold text-[#151515]">{pct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F0F0F0] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {daysUntilReset !== null && (
                  <p className="text-xs text-[#9B9B9B]">
                    Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }

      case "Security":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#151515]">Privacy & Security</h2>
            <p className="text-sm text-[#62646A]">No actions available at this time.</p>
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal — slides up from bottom on mobile, centered on desktop */}
      <div className="relative z-10 w-full sm:w-[95vw] sm:max-w-[900px] h-[92dvh] sm:h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden">

        {/* ── MOBILE: nav list view ── */}
        <div className={cn("sm:hidden flex flex-col h-full", mobileView === "list" ? "flex" : "hidden")}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#F0F0F0] shrink-0">
            <span className="text-base font-semibold text-[#151515]">Settings</span>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#6B6B6B]">
              <X size={18} />
            </button>
          </div>

          {/* User card */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F0F0F0] shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-purple-600 flex items-center justify-center text-white text-base font-semibold shrink-0">{initial}</div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#151515] truncate">{displayName}</p>
              <p className="text-xs text-[#62646A] truncate">{email}</p>
            </div>
          </div>

          {/* Nav list */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileView("content"); setShowClearConfirm(false); setShowDeleteConfirm(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-left mb-0.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[#444]" />
                  </div>
                  <span className="text-[14px] font-medium text-[#151515] flex-1">{item.label}</span>
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="text-[#BCBCBC]">
                    <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              );
            })}
          </nav>

          {/* Logout button — always visible at bottom */}
          <div className="px-3 pb-6 pt-2 border-t border-[#F0F0F0] shrink-0">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#ECEDEE] hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <LogOut size={15} className="text-red-500" />
              </div>
              <span className="text-[14px] font-medium text-red-500 flex-1">
                {isLoggingOut ? "Logging out…" : "Log out"}
              </span>
              {isLoggingOut && <Loader2 size={14} className="animate-spin text-red-400" />}
            </button>
          </div>
        </div>

        {/* ── MOBILE: content view ── */}
        <div className={cn("sm:hidden flex flex-col h-full", mobileView === "content" ? "flex" : "hidden")}>
          {/* Back header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#F0F0F0] shrink-0">
            <button
              onClick={() => { setMobileView("list"); setShowClearConfirm(false); setShowDeleteConfirm(false); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#6B6B6B] mr-1"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-base font-semibold text-[#151515] flex-1">
              {showClearConfirm || showDeleteConfirm ? "Confirm" : activeTab}
            </span>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#6B6B6B]">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {renderContent()}
          </div>
        </div>

        {/* ── DESKTOP: sidebar + content ── */}
        <aside className="hidden sm:flex w-[220px] shrink-0 flex-col py-6 px-3 border-r border-[#F0F0F0]">
          <div className="flex items-center justify-between px-2 mb-5">
            <span className="text-base font-semibold text-[#151515]">Settings</span>
          </div>
          <nav className="flex flex-col space-y-0.5 flex-1">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !showClearConfirm && !showDeleteConfirm;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowClearConfirm(false); setShowDeleteConfirm(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all text-left",
                    isActive ? "bg-purple-50 text-purple-700" : "text-[#444] hover:bg-gray-100 hover:text-[#151515]"
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

        {/* Desktop content */}
        <main className="hidden sm:flex flex-1 flex-col overflow-hidden">
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
    </div>,
    document.body
  );
}
