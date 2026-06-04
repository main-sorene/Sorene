"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { getUserProfile } from "@/lib/firestore";
import { useQuery } from "@tanstack/react-query";
import type { MIEReport, MIEStatus } from "@/types/mie";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const LOADING_STEPS = [
  "Scanning market signals across 8 categories…",
  "Identifying industries under pressure…",
  "Detecting emerging demand gaps…",
  "Matching opportunities to your DNA profile…",
  "Scoring and ranking your top opportunities…",
];

interface CachedMIE {
  report: MIEReport;
  cached_at: number;
}

function cacheKey(uid: string) {
  return `mie_report_${uid}`;
}

function loadFromCache(uid: string): MIEReport | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const cached: CachedMIE = JSON.parse(raw);
    if (Date.now() - cached.cached_at > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(uid));
      return null;
    }
    return cached.report;
  } catch {
    return null;
  }
}

function saveToCache(uid: string, report: MIEReport) {
  try {
    const cached: CachedMIE = { report, cached_at: Date.now() };
    localStorage.setItem(cacheKey(uid), JSON.stringify(cached));
  } catch {
    // storage full — proceed without caching
  }
}

export function useMIE() {
  const user = useAtomValue(userAtom);
  const [status, setStatus] = useState<MIEStatus>("idle");
  const [report, setReport] = useState<MIEReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ["mie-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  // Load cached report on mount
  useEffect(() => {
    if (!user?.uid) return;
    const cached = loadFromCache(user.uid);
    if (cached) {
      setReport(cached);
      setStatus("complete");
    }
  }, [user?.uid]);

  const hasProfile = !!(profile?.dnaScores && profile?.assessmentAnswers);
  const canGenerate = hasProfile && status !== "loading";
  const lastRun = report?.generated_at ?? null;

  const generate = useCallback(async () => {
    if (!canGenerate || !user?.uid || !profile) return;

    setStatus("loading");
    setLoadingStep(0);
    setErrorMessage(null);

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 2800);

    try {
      const res = await authFetch("/api/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName ?? "there",
          dnaScores: profile.dnaScores,
          rawAnswers: profile.assessmentAnswers ?? {},
          cvSummary: profile.cvSummary,
        }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Generation failed");
      }

      const data = await res.json() as { report: MIEReport };
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
