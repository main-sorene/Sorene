"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { getUserProfile } from "@/lib/firestore";
import { useQuery } from "@tanstack/react-query";
import type { ProblemScanReport, ProblemScanStatus } from "@/types/problemScan";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const LOADING_STEPS = [
  "Scanning Reddit, Quora, and X for pain signals…",
  "Browsing Product Hunt and App Store reviews…",
  "Extracting and scoring frustrations…",
  "Filtering high-signal opportunities…",
  "Matching to your skills and DNA profile…",
  "Ranking your top 5 business opportunities…",
];

interface CachedScan {
  report: ProblemScanReport;
  cached_at: number;
}

function cacheKey(uid: string) {
  return `problem_scan_${uid}`;
}

function loadFromCache(uid: string): ProblemScanReport | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const cached: CachedScan = JSON.parse(raw);
    if (Date.now() - cached.cached_at > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(uid));
      return null;
    }
    return cached.report;
  } catch {
    return null;
  }
}

function saveToCache(uid: string, report: ProblemScanReport) {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify({ report, cached_at: Date.now() }));
  } catch {
    // storage full — proceed silently
  }
}

export function useProblemScan() {
  const user = useAtomValue(userAtom);
  const [status, setStatus] = useState<ProblemScanStatus>("idle");
  const [report, setReport] = useState<ProblemScanReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ["problem-scan-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!user?.uid) return;
    const cached = loadFromCache(user.uid);
    if (cached) {
      setReport(cached);
      setStatus("complete");
    }
  }, [user?.uid]);

  // Auto-generate on first visit when profile is ready and no cached report
  useEffect(() => {
    if (!user?.uid || !profile || status !== "idle" || report) return;
    const hasP = !!(profile.dnaAssessmentComplete || profile.dnaScores);
    if (!hasP) return;
    const cached = loadFromCache(user.uid);
    if (cached) return;
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, profile, status, report]);

  const hasProfile = !!(profile?.dnaAssessmentComplete || profile?.dnaScores);
  const canGenerate = !!user?.uid && hasProfile && status !== "loading";
  const lastRun = report?.generated_at ?? null;

  const generate = useCallback(async () => {
    if (!canGenerate || !user?.uid) return;

    setStatus("loading");
    setLoadingStep(0);
    setErrorMessage(null);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 8000);

    try {
      const res = await authFetch("/api/problem-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile?.firstName ?? "there",
          dnaScores: profile?.dnaScores ?? {},
          rawAnswers: profile?.assessmentAnswers ?? {},
          cvSummary: profile?.cvSummary,
        }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Generation failed");
      }

      const data = await res.json() as { report: ProblemScanReport };
      saveToCache(user.uid, data.report);
      setReport(data.report);
      setStatus("complete");
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }, [canGenerate, user?.uid, profile]);

  return {
    status,
    report,
    lastRun,
    canGenerate,
    hasProfile,
    errorMessage,
    loadingStep,
    loadingSteps: LOADING_STEPS,
    generate,
  };
}
