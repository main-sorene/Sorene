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
  const [needsRC, setNeedsRC] = useState(false);

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

    // Check whether user has filled in R&C (localStorage)
    const hasRCData = (() => {
      try {
        const stored = localStorage.getItem("resourcesConstraints");
        if (!stored) return false;
        const rc = JSON.parse(stored);
        return Object.values(rc).some((v) => String(v ?? "").trim() !== "");
      } catch { return false; }
    })();

    // New path: structured direction cards
    // Skip if cards are old format (missing why_fits_you = pre-v2 cards) — fall through to regenerate
    // Also skip if user hasn't filled R&C yet — clear stale cards and show R&C form
    const cachedCards = profile.directionCards;
    const cardsAreUpToDate = cachedCards && cachedCards.length > 0 && cachedCards[0].why_fits_you && (cachedCards[0].ikigai_filters || cachedCards[0].four_filters);
    if (cardsAreUpToDate) {
      if (!hasRCData) {
        // Cards exist but no R&C — clear them and prompt R&C form
        setDirectionCards([]);
        setNeedsRC(true);
        if (user?.uid) {
          saveUserProfile(user.uid, { directionCards: [] as any, directionText: "" });
        }
        setHasStreamed(true);
        return;
      }
      setDirectionCards(cachedCards);
      setHasStreamed(true);
      return;
    }

    // Legacy fallback: old streamed text — skip it and fall through to regenerate with new format
    // (old directionText doesn't produce structured cards with full analysis)
    if (profile.directionText && !profile.directionEligibility) {
      setStreamedText(profile.directionText);
      setHasStreamed(true);
      return;
    }

    if (!profile.directionEligibility || !profile.assessmentAnswers) return;
    if (!profile.directionEligibility.eligible) return;

    // Don't auto-generate until user has filled in Resources & Constraints.
    // This ensures the first direction is grounded in their real-life constraints.
    try {
      const stored = localStorage.getItem("resourcesConstraints");
      const rc = stored ? JSON.parse(stored) : {};
      const hasAnyRC = Object.values(rc).some((v) => String(v ?? "").trim() !== "");
      if (!hasAnyRC) { setNeedsRC(true); return; } // wait for R&C form to be filled
    } catch {}

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

        const resources = (() => {
          try {
            const stored = localStorage.getItem("resourcesConstraints");
            return stored ? JSON.parse(stored) : undefined;
          } catch { return undefined; }
        })();

        const res = await authFetch("/api/direction-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            models,
            scores: profile.dnaScores,
            firstName,
            rawAnswers: profile.assessmentAnswers,
            cvSummary: profile.cvSummary,
            dnaNarrative: profile.dna_narrative,
            resources,
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
            // Save new cards and clear old directionText to prevent re-triggering legacy path
            await saveUserProfile(user.uid, { directionCards: cards, directionText: "" });
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
    needsRC,
  };
}
