"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useQuery } from "@tanstack/react-query";
import type { DirectionCardData } from "@/lib/directionTypes";
import type { StructuralModel } from "@/lib/dnaEngine";

export type DirectionAlternative = {
  model: string;
  compatibility: number;
  summary?: string;
};

export function useDirectionResult() {
  const user = useAtomValue(userAtom);
  // Legacy streaming text — kept for users who have old cached data
  const [streamedText, setStreamedText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStreamed, setHasStreamed] = useState(false);
  const [directionCards, setDirectionCards] = useState<DirectionCardData[]>([]);
  const [alternatives, setAlternatives] = useState<DirectionAlternative[]>([]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["direction-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!profile || hasStreamed) return;

    // Seed alternatives from cache
    if (profile.directionAlternatives && profile.directionAlternatives.length > 0) {
      setAlternatives(profile.directionAlternatives);
    }

    // New path: structured direction cards
    if (profile.directionCards && profile.directionCards.length > 0) {
      setDirectionCards(profile.directionCards);
      setHasStreamed(true);
      return;
    }

    // Legacy fallback: old streamed text
    if (profile.directionText) {
      setStreamedText(profile.directionText);
      setHasStreamed(true);
      const alts = profile.directionAlternatives || [];
      const needSummaries = alts.filter((a) => a.model !== profile.directionEligibility?.model).slice(0, 2);
      if (needSummaries.length > 0 && needSummaries.some((a) => !a.summary)) {
        fetchLegacyAlternativeSummaries(needSummaries, profile);
      }
      return;
    }

    if (!profile.directionEligibility || !profile.assessmentAnswers) return;
    if (!profile.directionEligibility.eligible) return;

    const generate = async () => {
      setIsStreaming(true);
      setHasStreamed(true);

      try {
        const firstName = profile.firstName || "there";
        const primaryModel = profile.directionEligibility!.model as StructuralModel;
        const allAlts = profile.directionAlternatives || [];

        // Build models list: primary + up to 2 alternatives
        const altModels = allAlts
          .filter((a) => a.model !== primaryModel)
          .slice(0, 2)
          .map((a) => ({ model: a.model as StructuralModel, compatibility: a.compatibility, isPrimary: false }));

        const primaryAlt = allAlts.find((a) => a.model === primaryModel);
        const models = [
          { model: primaryModel, compatibility: primaryAlt?.compatibility ?? 100, isPrimary: true },
          ...altModels,
        ];

        const res = await authFetch("/api/direction-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            models,
            scores: profile.dnaScores,
            firstName,
            rawAnswers: profile.assessmentAnswers,
            cvSummary: profile.cvSummary,
          }),
        });

        if (!res.ok) {
          setIsStreaming(false);
          return;
        }

        const data = (await res.json()) as { cards?: DirectionCardData[] };
        const cards = data.cards || [];

        if (cards.length > 0) {
          setDirectionCards(cards);
          if (user?.uid) {
            await saveUserProfile(user.uid, { directionCards: cards });
          }
        }
      } finally {
        setIsStreaming(false);
      }
    };

    generate();
  }, [profile, hasStreamed, user]);

  async function fetchLegacyAlternativeSummaries(
    alts: DirectionAlternative[],
    profileSnapshot: NonNullable<typeof profile>,
  ) {
    try {
      const res = await authFetch("/api/direction-alternatives", {
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

  const eligibleModel = profile?.directionEligibility?.eligible ? profile.directionEligibility.model : null;
  const primaryCard = directionCards.find((c) => c.title) ? directionCards[0] : null;
  const altCards = directionCards.slice(1);

  // Legacy
  const otherDirections = alternatives
    .filter((a) => a.model !== eligibleModel)
    .slice(0, 2);

  return {
    // Structured cards (new path)
    primaryCard,
    altCards,
    // Legacy text path
    directionText: streamedText,
    // Shared
    isLoading: isLoading || isStreaming,
    eligibility: profile?.directionEligibility,
    model: eligibleModel,
    bestCompatibility: alternatives.find((a) => a.model === eligibleModel)?.compatibility ?? 100,
    otherDirections,
  };
}
