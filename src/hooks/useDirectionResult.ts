"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useQuery } from "@tanstack/react-query";

export type DirectionAlternative = {
  model: string;
  compatibility: number;
  summary?: string;
};

export function useDirectionResult() {
  const user = useAtomValue(userAtom);
  const [streamedText, setStreamedText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStreamed, setHasStreamed] = useState(false);
  const [alternatives, setAlternatives] = useState<DirectionAlternative[]>([]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["direction-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!profile || hasStreamed) return;

    // Seed alternatives from cache if available
    if (profile.directionAlternatives && profile.directionAlternatives.length > 0) {
      setAlternatives(profile.directionAlternatives);
    }

    // If we already have a cached direction text, use it
    if (profile.directionText) {
      setStreamedText(profile.directionText);
      setHasStreamed(true);

      // If alternatives lack summaries, generate them
      const alts = profile.directionAlternatives || [];
      const needSummaries = alts.filter((a) => a.model !== profile.directionEligibility?.model).slice(0, 2);
      if (needSummaries.length > 0 && needSummaries.some((a) => !a.summary)) {
        fetchAlternativeSummaries(needSummaries, profile);
      }
      return;
    }

    if (!profile.directionEligibility || !profile.assessmentAnswers) return;

    const stream = async () => {
      setIsStreaming(true);
      setHasStreamed(true);
      try {
        const firstName = profile.firstName || "there";
        const res = await fetch("/api/direction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eligibility: {
              eligible: profile.directionEligibility!.eligible,
              model: profile.directionEligibility!.model,
              reason: profile.directionEligibility!.reason,
              scores: profile.dnaScores,
            },
            firstName,
            rawAnswers: profile.assessmentAnswers,
            cvSummary: profile.cvSummary,
          }),
        });

        if (!res.ok || !res.body) {
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamedText(fullText);
        }

        if (user?.uid && fullText) {
          await saveUserProfile(user.uid, { directionText: fullText });
        }

        // After main direction streams, fetch alternative summaries
        const alts = profile.directionAlternatives || [];
        const altsToSummarize = alts
          .filter((a) => a.model !== profile.directionEligibility?.model)
          .slice(0, 2);
        if (altsToSummarize.length > 0) {
          fetchAlternativeSummaries(altsToSummarize, profile);
        }
      } finally {
        setIsStreaming(false);
      }
    };

    stream();
  }, [profile, hasStreamed, user]);

  async function fetchAlternativeSummaries(
    alts: DirectionAlternative[],
    profileSnapshot: NonNullable<typeof profile>,
  ) {
    try {
      const res = await fetch("/api/direction-alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          models: alts.map((a) => ({ model: a.model, compatibility: a.compatibility })),
          scores: profileSnapshot.dnaScores,
          firstName: profileSnapshot.firstName || "there",
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { summaries?: string[] };
      if (!data.summaries || data.summaries.length === 0) return;
      const updated = alts.map((a, i) => ({ ...a, summary: data.summaries![i] || a.summary }));
      // Merge updated alternatives back into full list
      const fullList = (profileSnapshot.directionAlternatives || []).map((a) => {
        const match = updated.find((u) => u.model === a.model);
        return match || a;
      });
      setAlternatives(fullList);
      if (user?.uid) {
        await saveUserProfile(user.uid, { directionAlternatives: fullList });
      }
    } catch (err) {
      console.warn("[direction-alternatives] fetch failed:", err);
    }
  }

  const model = profile?.directionEligibility?.eligible ? profile.directionEligibility.model : null;
  const otherDirections = alternatives
    .filter((a) => a.model !== model)
    .slice(0, 2);

  return {
    directionText: streamedText,
    isLoading: isLoading || isStreaming,
    eligibility: profile?.directionEligibility,
    model,
    bestCompatibility: alternatives.find((a) => a.model === model)?.compatibility ?? 100,
    otherDirections,
  };
}
