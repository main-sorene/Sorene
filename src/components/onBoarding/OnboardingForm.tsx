"use client";

import { useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { userAtom, isAssessmentCompleteAtom } from "@/store/atoms";
import { saveUserProfile } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function OnboardingForm() {
  const [authUser, setAuthUser] = useAtom(userAtom);
  const setIsAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const [firstName, setFirstName] = useState(authUser?.profile?.firstName || authUser?.displayName?.split(" ")[0] || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = firstName.trim();
    if (!name) { setError("Please enter your first name."); return; }
    if (!authUser?.uid) return;

    setIsSubmitting(true);
    try {
      const profileData = {
        firstName: name,
        lastName: authUser.profile?.lastName || "",
        email: authUser.email || "",
        useCase: "general",
        onboardingComplete: true,
        dnaAssessmentComplete: false,
        photoUrl: authUser.photoURL || authUser.profile?.photoUrl || undefined,
      };

      await saveUserProfile(authUser.uid, profileData as any);
      setAuthUser({
        ...authUser,
        profile: {
          ...(authUser.profile as any),
          ...profileData,
          createdAt: authUser.profile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      setIsAssessmentComplete(false);
      router.push("/chat");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <img className="h-12 w-12 mb-4 mx-auto" alt="Sorene" src="/figmaAssets/logo.png" />

        <h1 className="text-2xl font-semibold text-[#151515] mb-2">What should Sorene call you?</h1>
        <p className="text-sm text-[#62646A] mb-8">
          Just your first name is enough to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(""); }}
              placeholder="Your first name"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-[#151515] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#151515] transition-colors"
            />
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !firstName.trim()}
            className="w-full bg-[#151515] text-white text-[14px] font-semibold rounded-xl py-3 hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? "Starting…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
