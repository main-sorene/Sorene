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
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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

    // Don't auto-generate until user explicitly clicks "Generate Direction".
    // R&C data being present is not enough — we require the explicit intent flag.
    const hasGenerationIntent = localStorage.getItem("rcGenerationRequested") === "true";
    if (!hasGenerationIntent) { setNeedsRC(true); return; }

    const generate = async () => {
      setIsStreaming(true);
      setHasStreamed(true);

      try {
        const firstName = profile.firstName || "there";
        const primaryModel = profile.directionEligibility!.model as StructuralModel;
        const allAlts = profile.directionAlternatives || [];

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

        const basePayload = {
          models,
          cardIndex: 0,
          scores: profile.dnaScores,
          firstName,
          rawAnswers: profile.assessmentAnswers,
          cvSummary: profile.cvSummary,
          dnaNarrative: profile.dna_narrative,
          resources,
        };

        // Phase 1: fast card shell (Haiku, ~8s)
        const res1 = await authFetch("/api/direction-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, phase: 1 }),
        });

        if (!res1.ok) return;

        const data1 = (await res1.json()) as { cards?: DirectionCardData[] };
        const phase1Card = data1.cards?.[0];

        if (phase1Card) {
          setDirectionCards([phase1Card]);
          setIsStreaming(false);
          setIsLoadingDetails(true);

          // Phase 2: deep analysis in background (Sonnet, ~15-20s)
          try {
            const res2 = await authFetch("/api/direction-cards", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...basePayload, phase: 2, phase1Card }),
            });

            if (res2.ok) {
              const data2 = (await res2.json()) as { cards?: DirectionCardData[] };
              const phase2Fields = data2.cards?.[0];
              if (phase2Fields) {
                const fullCard = { ...phase1Card, ...phase2Fields };
                setDirectionCards([fullCard]);
                if (user?.uid) {
                  await saveUserProfile(user.uid, { directionCards: [fullCard], directionText: "" });
                }
              }
            }
          } finally {
            setIsLoadingDetails(false);
          }
        }
      } finally {
        setIsStreaming(false);
      }
    };

    generate();
  }, [profile, hasStreamed, user]);

  const generateMore = async () => {
    if (!profile || isGeneratingMore) return;
    // Cap at 2 (Stretch) for path label, but allow unlimited cards
    const nextIndex = Math.min(directionCards.length, 2);

    const primaryModel = profile.directionEligibility?.model as StructuralModel | undefined;
    if (!primaryModel) return;

    const allAlts = profile.directionAlternatives || [];
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

    setIsGeneratingMore(true);
    try {
      const basePayload = {
        models,
        cardIndex: nextIndex,
        scores: profile.dnaScores,
        firstName: profile.firstName || "there",
        rawAnswers: profile.assessmentAnswers,
        cvSummary: profile.cvSummary,
        dnaNarrative: profile.dna_narrative,
        resources,
      };

      // Alt cards (index > 0) use single-phase Haiku for speed
      if (nextIndex > 0) {
        const res = await authFetch("/api/direction-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { cards?: DirectionCardData[] };
        const newCard = data.cards?.[0];
        if (newCard) {
          setDirectionCards((prev) => {
            const updated = [...prev, newCard];
            if (user?.uid) saveUserProfile(user.uid, { directionCards: updated });
            return updated;
          });
        }
        return;
      }

      // Primary card (index 0): two-phase
      const res1 = await authFetch("/api/direction-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayload, phase: 1 }),
      });
      if (!res1.ok) return;
      const data1 = (await res1.json()) as { cards?: DirectionCardData[] };
      const phase1Card = data1.cards?.[0];
      if (!phase1Card) return;

      setDirectionCards((prev) => [...prev, phase1Card]);

      const res2 = await authFetch("/api/direction-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayload, phase: 2, phase1Card }),
      });
      if (res2.ok) {
        const data2 = (await res2.json()) as { cards?: DirectionCardData[] };
        const phase2Fields = data2.cards?.[0];
        if (phase2Fields) {
          const fullCard = { ...phase1Card, ...phase2Fields };
          setDirectionCards((prev) => {
            const updated = [...prev.slice(0, -1), fullCard];
            if (user?.uid) saveUserProfile(user.uid, { directionCards: updated });
            return updated;
          });
        }
      }
    } finally {
      setIsGeneratingMore(false);
    }
  };

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

  // Show button whenever R&C is filled (no hard cap — user can always generate more)
  const hasRCFilled = (() => {
    try {
      const stored = localStorage.getItem("resourcesConstraints");
      if (!stored) return false;
      const rc = JSON.parse(stored);
      return Object.values(rc).some((v) => String(v ?? "").trim() !== "");
    } catch { return false; }
  })();
  const canGenerateMore = hasRCFilled;

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
    generateMore,
    isGeneratingMore,
    isLoadingDetails,
    canGenerateMore,
    directionCardsCount: directionCards.length,
  };
}
