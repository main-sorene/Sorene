"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useQuery } from "@tanstack/react-query";
import type { MIEReport } from "@/types/mie";

const LOADING_STEPS = [
  "Scanning market trends…",
  "Checking supply gaps…",
  "Matching to your DNA…",
  "Building your report…",
];

export function useMIE() {
  const user = useAtomValue(userAtom);
  const [status, setStatus] = useState<"idle" | "loading" | "complete" | "error">("idle");
  const [report, setReport] = useState<MIEReport | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["direction-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  // Load cached report on mount
  useEffect(() => {
    if (!profile) return;
    const cached = (profile as any).mieReport as MIEReport | undefined;
    if (cached?.opportunities?.length) {
      setReport(cached);
      setLastRun(cached.generated_at);
      setStatus("complete");
    }
  }, [profile?.email ?? ""]);

  // Cycle loading step
  useEffect(() => {
    if (status !== "loading") return;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [status]);

  const hasProfile = !!(profile?.dnaScores && profile?.assessmentAnswers);
  const canGenerate = hasProfile && status !== "loading";

  const generate = async () => {
    if (!profile || !canGenerate) return;
    setStatus("loading");
    setLoadingStep(0);
    setErrorMessage(null);

    try {
      const res = await authFetch("/api/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName || "there",
          dnaScores: profile.dnaScores,
          rawAnswers: profile.assessmentAnswers,
          cvSummary: profile.cvSummary,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || "Failed to generate report.");
        setStatus("error");
        return;
      }

      const data = await res.json() as { report: MIEReport };
      setReport(data.report);
      setLastRun(data.report.generated_at);
      setStatus("complete");

      if (user?.uid) {
        await saveUserProfile(user.uid, { mieReport: data.report } as any);
      }
    } catch (err) {
      console.error("[useMIE] generate failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  return { status, report, lastRun, canGenerate, hasProfile, errorMessage, loadingStep, loadingSteps: LOADING_STEPS, generate };
}
