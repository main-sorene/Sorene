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
  Plug,
  CreditCard,
  Database,
  Lock,
  LogOut,
  X,
  Check,
  AlertTriangle,
  Camera,
  ChevronDown,
} from "lucide-react";
import { SubscriptionContent } from "@/components/settings/SubscriptionContent";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useToast } from "@/hooks/use-toast";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { saveUserProfile, deleteUserProfile } from "@/lib/firestore";

const SIDEBAR_ITEMS = [
  { id: "General", icon: Settings, label: "General" },
  { id: "Account", icon: User, label: "Account" },
  { id: "Preferences", icon: Wrench, label: "Preferences" },
  { id: "Notifications", icon: Bell, label: "Notifications" },
  { id: "Integrations", icon: Plug, label: "Integrations" },
  { id: "Manage Subscription", icon: CreditCard, label: "Manage Subscription" },
  { id: "Data control", icon: Database, label: "Data control" },
  { id: "Security", icon: Lock, label: "Privacy & Security" },
];

const GENDER_OPTIONS = ["Male", "Female"];

const WORK_TYPES = [
  "Product management",
  "Engineering",
  "Human resources",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "Data science",
  "Design",
  "Legal",
  "Other",
];

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

// Birthday stored as MM/DD/YYYY in Firestore; <input type="date"> needs YYYY-MM-DD
function birthdayToInputValue(birthday: string): string {
  if (!birthday) return "";
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return birthday;
  // MM/DD/YYYY format from onboarding
  const [m, d, y] = birthday.split("/");
  return y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "";
}

function inputValueToBirthday(value: string): string {
  // Store as MM/DD/YYYY for consistency with onboarding
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return y && m && d ? `${m}/${d}/${y}` : "";
}

function generateOrgId(uid: string): string {
  const hash = uid.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  return `ORG-${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}`;
}

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
  const [workType, setWorkType] = React.useState(authUser?.profile?.workType || "");
  const [workDropdownOpen, setWorkDropdownOpen] = React.useState(false);
  const [customWork, setCustomWork] = React.useState("");
  const [isSavingGeneral, setIsSavingGeneral] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const genderDropdownRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // Sync form state when user data changes
  React.useEffect(() => {
    if (authUser) {
      setFirstName(authUser.profile?.firstName || "");
      setLastName(authUser.profile?.lastName || "");
      setBirthday(authUser.profile?.birthday || "");
      setGender(authUser.profile?.sex || "");
      setNickname(authUser.profile?.nickname || "");
      setWorkType(authUser.profile?.workType || "");
    }
  }, [authUser]);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWorkDropdownOpen(false);
      }
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
          k.startsWith("direction_chat_")
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
      if (uid) {
        await deleteUserProfile(uid);
      }
      // Delete the Firebase Auth user so there's no stale session on redirect
      if (auth?.currentUser) {
        await deleteUser(auth.currentUser).catch(() => signOut(auth!));
      } else if (auth) {
        await signOut(auth);
      }
      setUser(null);
      setConversations([]);
      setIsAssessmentComplete(false);
      // Clear all local storage data for this user
      try {
        Object.keys(sessionStorage).filter(k => k.startsWith("assessment_state_")).forEach(k => sessionStorage.removeItem(k));
        Object.keys(localStorage).filter(k =>
          k.startsWith("assessment_conv_") ||
          k.startsWith("convos_") ||
          k.startsWith("dna_chat_") ||
          k.startsWith("direction_chat_")
        ).forEach(k => localStorage.removeItem(k));
      } catch {}
      setShowDeleteConfirm(false);
      setIsOpen(false);
      // Use window.location for a full page reload to avoid AuthPersistence race conditions
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
      const finalWorkType = workType === "Other" ? customWork : workType;
      await saveUserProfile(authUser.uid, {
        firstName,
        lastName,
        birthday,
        sex: gender,
        nickname,
        workType: finalWorkType,
        occupation: WORK_TYPES.indexOf(finalWorkType) >= 0
          ? finalWorkType.toLowerCase().replace(/ /g, "_")
          : finalWorkType,
      });
      setUser({
        ...authUser,
        displayName: `${firstName} ${lastName}`.trim() || authUser.displayName,
        profile: authUser.profile
          ? { ...authUser.profile, firstName, lastName, birthday, sex: gender, nickname, workType: finalWorkType }
          : undefined,
      });
      toast({ description: "Settings saved." });
    } catch {
      toast({ description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const filteredSidebarItems = SIDEBAR_ITEMS.filter((item) => {
    if (item.id === "Manage Subscription") return !!subscription?.active;
    return true;
  });

  const displayName = [authUser?.profile?.firstName, authUser?.profile?.lastName].filter(Boolean).join(" ") || authUser?.displayName || authUser?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();
  const email = authUser?.email || "";
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
      case "General":
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#151515]">General</h2>

            {/* Avatar */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">Profile Photo</p>
              <div className="flex items-center gap-4">
                <div className="relative group">
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
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    {isUploadingAvatar ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
                  </button>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">JPG, PNG. Max 5MB.</p>
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

            {/* CV / Portfolio */}
            <div>
              <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2 block">CV / Portfolio</label>
              {authUser?.profile?.cvData?.file_name ? (
                <div className="rounded-xl border border-[#ECEDEE] px-4 py-3 flex items-center gap-3">
                  <img src="/figmaAssets/FilePdf.svg" alt="PDF" className="w-8 h-8" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#151515] truncate">{authUser.profile.cvData.file_name}</p>
                    <p className="text-xs text-[#9B9B9B]">Uploaded during onboarding</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D0D0D0] px-4 py-4 text-center">
                  <p className="text-sm text-[#9B9B9B]">No CV uploaded yet</p>
                  <p className="text-xs text-[#BCBCBC] mt-1">Upload during onboarding to see it here</p>
                </div>
              )}
            </div>

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

            {/* Work Type */}
            <div ref={dropdownRef} className="relative">
              <label className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2 block">What best describes your work?</label>
              <button
                onClick={() => setWorkDropdownOpen(!workDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#ECEDEE] text-sm text-left hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <span className={workType ? "text-[#151515]" : "text-[#9B9B9B]"}>
                  {workType || "Select your work type"}
                </span>
                <ChevronDown size={16} className={cn("text-[#9B9B9B] transition-transform", workDropdownOpen && "rotate-180")} />
              </button>
              {workDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-[#ECEDEE] shadow-lg max-h-64 overflow-y-auto">
                  {WORK_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => { setWorkType(type); setWorkDropdownOpen(false); if (type !== "Other") setCustomWork(""); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors flex items-center justify-between",
                        workType === type && "bg-purple-50 text-purple-700",
                      )}
                    >
                      {type}
                      {workType === type && <Check size={14} className="text-purple-600" />}
                    </button>
                  ))}
                </div>
              )}
              {workType === "Other" && (
                <input
                  type="text"
                  value={customWork}
                  onChange={(e) => setCustomWork(e.target.value)}
                  placeholder="Describe your work"
                  className="w-full mt-2 px-4 py-3 rounded-xl border border-[#ECEDEE] text-sm text-[#151515] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                />
              )}
            </div>

            {/* Save */}
            <button
              onClick={handleSaveGeneral}
              disabled={isSavingGeneral}
              className="px-6 py-2.5 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {isSavingGeneral ? "Saving…" : "Save changes"}
            </button>
          </div>
        );

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

      case "Manage Subscription":
        return <SubscriptionContent />;

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full h-full sm:w-[95vw] sm:max-w-[900px] sm:h-[85vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full sm:w-[220px] shrink-0 flex flex-col py-3 sm:py-6 px-3 border-b sm:border-b-0 sm:border-r border-[#F0F0F0] overflow-x-auto sm:overflow-visible">
          <div className="hidden sm:flex items-center justify-between px-2 mb-5">
            <span className="text-base font-semibold text-[#151515]">Settings</span>
          </div>
          <nav className="flex sm:flex-col flex-row gap-1 sm:gap-0 sm:space-y-0.5 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 sm:flex-1">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !showClearConfirm && !showDeleteConfirm;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowClearConfirm(false); setShowDeleteConfirm(false); }}
                  className={cn(
                    "sm:w-full flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg text-[13px] sm:text-[14px] font-medium transition-all text-left whitespace-nowrap shrink-0 sm:shrink sm:whitespace-normal",
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
            className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium text-red-500 hover:bg-red-50 transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
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
    </div>,
    document.body
  );
}
