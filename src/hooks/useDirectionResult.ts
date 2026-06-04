"use client";

import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, recipeDirectionsAtom, type RecipeDirection } from "@/store/atoms";
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
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [loadingDetailFor, setLoadingDetailFor] = useState<string | null>(null);
  const [loadingSection3For, setLoadingSection3For] = useState<string | null>(null);
  const [loadingSection4For, setLoadingSection4For] = useState<string | null>(null);

  // Recipe (brainstorm/check-my-idea) cards — shared via jotai so DirectionChat
  // and DirectionSection see the same list and lazy-load the same staged data.
  const setRecipeDirections = useSetAtom(recipeDirectionsAtom);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [loadingRecipeDetailFor, setLoadingRecipeDetailFor] = useState<string | null>(null);
  const [loadingRecipeSection3For, setLoadingRecipeSection3For] = useState<string | null>(null);
  const [loadingRecipeSection4For, setLoadingRecipeSection4For] = useState<string | null>(null);

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
    // Accept phase 1 cards (title + constraint_check) as well as fully analyzed cards
    const cachedCards = profile.directionCards;
    const cardsAreUpToDate = cachedCards && cachedCards.length > 0 &&
      ((cachedCards[0].title && cachedCards[0].constraint_check) ||
       (cachedCards[0].why_fits_you && (cachedCards[0].ikigai_filters || cachedCards[0].four_filters)));
    if (cardsAreUpToDate) {
      // Show existing direction cards regardless of R&C status.
      // The R&C card appears below direction cards in the layout, so users can fill it any time.
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

    // Auto-generate on first visit: if user has never generated and has no cards,
    // kick off generation immediately (R&C form is optional — user can refine later).
    const hasGenerationIntent = localStorage.getItem("rcGenerationRequested") === "true";
    if (!hasGenerationIntent) {
      // Set the flag so subsequent visits don't re-trigger, then fall through to generate.
      try { localStorage.setItem("rcGenerationRequested", "true"); } catch {}
    }

    const generate = async () => {
      setIsStreaming(true);
      setHasStreamed(true);
      setGenerateError(null);

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

        // Phase 1 only: fast card shell (Haiku, ~8s)
        const res1 = await authFetch("/api/direction-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, phase: 1 }),
        });

        if (!res1.ok) {
          const detail = await res1.text().catch(() => "");
          setGenerateError(`Generation failed (${res1.status}). ${detail || "Please try again."}`);
          // Clear the intent so the user lands back on the form, not a dead spinner
          try { localStorage.removeItem("rcGenerationRequested"); } catch {}
          setNeedsRC(true);
          return;
        }

        const data1 = (await res1.json()) as { cards?: DirectionCardData[] };
        const phase1Card = data1.cards?.[0];

        if (phase1Card) {
          setDirectionCards([phase1Card]);
          // Save to Firestore immediately so refresh doesn't re-generate
          if (user?.uid) {
            await saveUserProfile(user.uid, { directionCards: [phase1Card], directionText: "" });
          }
        } else {
          setGenerateError("The engine returned no direction. Please try again.");
          try { localStorage.removeItem("rcGenerationRequested"); } catch {}
          setNeedsRC(true);
        }
      } catch (err) {
        console.error("[generate] failed:", err);
        setGenerateError(
          err instanceof Error ? err.message : "Something went wrong while generating. Please try again."
        );
        try { localStorage.removeItem("rcGenerationRequested"); } catch {}
        setNeedsRC(true);
      } finally {
        setIsStreaming(false);
      }
    };

    generate();
  }, [profile, hasStreamed, user]);

  const buildBasePayload = () => {
    if (!profile) return null;
    const primaryModel = profile.directionEligibility?.model as StructuralModel | undefined;
    if (!primaryModel) return null;

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

    return {
      models,
      scores: profile.dnaScores,
      firstName: profile.firstName || "there",
      rawAnswers: profile.assessmentAnswers,
      cvSummary: profile.cvSummary,
      dnaNarrative: profile.dna_narrative,
      resources,
    };
  };

  // Like buildBasePayload but does not require directionEligibility — recipe
  // ideas are anchored by the concept, so a model is optional (the API falls
  // back to a neutral one when none is provided).
  const buildRecipeBasePayload = () => {
    if (!profile) return null;
    const base = buildBasePayload();
    if (base) return base;
    const resources = (() => {
      try {
        const stored = localStorage.getItem("resourcesConstraints");
        return stored ? JSON.parse(stored) : undefined;
      } catch { return undefined; }
    })();
    return {
      models: [] as { model: StructuralModel; compatibility: number; isPrimary: boolean }[],
      scores: profile.dnaScores,
      firstName: profile.firstName || "there",
      rawAnswers: profile.assessmentAnswers,
      cvSummary: profile.cvSummary,
      dnaNarrative: profile.dna_narrative,
      resources,
    };
  };

  const persistRecipes = (updater: (prev: RecipeDirection[]) => RecipeDirection[]) => {
    setRecipeDirections((prev) => {
      const updated = updater(prev);
      try { localStorage.setItem("recipeDirections", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Generate the fast phase-1 shell for a brainstormed idea (concept), then add
  // it to the shared recipe list so it renders with the staged template.
  const generateRecipeCard = async (concept: string): Promise<RecipeDirection | null> => {
    if (generatingRecipe) return null;
    const base = buildRecipeBasePayload();
    if (!base) return null;
    setGeneratingRecipe(true);
    try {
      const res = await authFetch("/api/direction-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...base, cardIndex: 0, phase: 1, concept }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { cards?: DirectionCardData[] };
      const card = data.cards?.[0];
      if (!card) return null;
      const recipe: RecipeDirection = {
        id: `recipe-${Date.now()}`,
        title: card.title,
        description: card.description,
        whyFitsYou: card.why_fits_you ?? [],
        keyRisks: card.key_risks ?? [],
        firstStep: "",
        score: card.compatibility ?? 85,
        cardData: card,
        concept,
      };
      persistRecipes((prev) => [...prev, recipe]);
      return recipe;
    } catch (err) {
      console.error("[generateRecipeCard] failed:", err);
      return null;
    } finally {
      setGeneratingRecipe(false);
    }
  };

  // Lazy-load a staged phase (2/3/4) for a recipe card, anchored to its concept.
  const loadRecipePhase = async (
    id: string,
    phase: 2 | 3 | 4,
    setLoading: (v: string | null) => void,
    alreadyLoaded: (c: DirectionCardData) => boolean,
  ) => {
    setRecipeDirections((prevList) => {
      const recipe = prevList.find((r) => r.id === id);
      if (!recipe?.cardData || alreadyLoaded(recipe.cardData)) return prevList;
      const base = buildRecipeBasePayload();
      if (!base) return prevList;

      setLoading(id);
      (async () => {
        try {
          const res = await authFetch("/api/direction-cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...base, cardIndex: 0, phase, phase1Card: recipe.cardData, concept: recipe.concept }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { cards?: DirectionCardData[] };
          const fields = data.cards?.[0];
          if (fields) {
            persistRecipes((prev) => prev.map((r) =>
              r.id === id && r.cardData ? { ...r, cardData: { ...r.cardData, ...fields } } : r
            ));
          }
        } finally {
          setLoading(null);
        }
      })();
      return prevList;
    });
  };

  const loadRecipeDetail = (id: string) =>
    loadRecipePhase(id, 2, setLoadingRecipeDetailFor, (c) => !!c.ikigai_filters);
  const loadRecipeSection3 = (id: string) =>
    loadRecipePhase(id, 3, setLoadingRecipeSection3For, (c) => !!c.ocean_classification || !!c.trend_connection);
  const loadRecipeSection4 = (id: string) =>
    loadRecipePhase(id, 4, setLoadingRecipeSection4For, (c) => !!c.startup_cost_usd);

  const generateMore = async () => {
    if (isGeneratingMore) return;
    setGenerateError(null);

    if (!profile) {
      setGenerateError("Your profile is still loading. Please wait a moment and try again.");
      return;
    }

    // Cap at 2 (Stretch) for path label, but allow unlimited cards
    const nextIndex = Math.min(directionCards.length, 2);

    const basePayloadBase = buildBasePayload();
    if (!basePayloadBase) {
      setGenerateError(
        "We couldn't find your assessment results (DNA / eligibility). Complete the assessment first, then try again."
      );
      return;
    }

    const basePayload = { ...basePayloadBase, cardIndex: nextIndex };

    setNeedsRC(false);
    setIsGeneratingMore(true);
    try {
      // All cards use phase 1 only (single-phase Haiku for speed)
      const res = await authFetch("/api/direction-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayload, phase: 1 }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        setGenerateError(`Generation failed (${res.status}). ${detail || "Please try again."}`);
        return;
      }
      const data = (await res.json()) as { cards?: DirectionCardData[] };
      const newCard = data.cards?.[0];
      if (newCard) {
        setDirectionCards((prev) => {
          const updated = [...prev, newCard];
          if (user?.uid) saveUserProfile(user.uid, { directionCards: updated });
          return updated;
        });
      } else {
        setGenerateError("The engine returned no direction. Please try again.");
      }
    } catch (err) {
      console.error("[generateMore] failed:", err);
      setGenerateError(
        err instanceof Error ? err.message : "Something went wrong while generating. Please try again."
      );
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const loadCardDetail = async (cardTitle: string) => {
    if (loadingDetailFor !== null) return;
    const card = directionCards.find((c) => c.title === cardTitle);
    if (!card) return;
    if (card.ikigai_filters) return; // Already loaded

    const basePayloadBase = buildBasePayload();
    if (!basePayloadBase) return;

    const cardIndex = directionCards.findIndex((c) => c.title === cardTitle);

    setLoadingDetailFor(cardTitle);
    try {
      const res = await authFetch("/api/direction-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayloadBase, cardIndex, phase: 2, phase1Card: card }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { cards?: DirectionCardData[] };
      const phase2Fields = data.cards?.[0];
      if (phase2Fields) {
        const mergedCard = { ...card, ...phase2Fields };
        setDirectionCards((prev) => {
          const updated = prev.map((c) => c.title === cardTitle ? mergedCard : c);
          if (user?.uid) saveUserProfile(user.uid, { directionCards: updated });
          return updated;
        });
      }
    } finally {
      setLoadingDetailFor(null);
    }
  };

  const loadCardSection3 = async (cardTitle: string) => {
    if (loadingSection3For !== null) return;
    const card = directionCards.find((c) => c.title === cardTitle);
    if (!card) return;
    if (card.ocean_classification) return; // Already loaded

    const basePayloadBase = buildBasePayload();
    if (!basePayloadBase) return;

    const cardIndex = directionCards.findIndex((c) => c.title === cardTitle);

    setLoadingSection3For(cardTitle);
    try {
      const res = await authFetch("/api/direction-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayloadBase, cardIndex, phase: 3, phase1Card: card }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { cards?: DirectionCardData[] };
      const phase3Fields = data.cards?.[0];
      if (phase3Fields) {
        const mergedCard = { ...card, ...phase3Fields };
        setDirectionCards((prev) => {
          const updated = prev.map((c) => c.title === cardTitle ? mergedCard : c);
          if (user?.uid) saveUserProfile(user.uid, { directionCards: updated });
          return updated;
        });
      }
    } finally {
      setLoadingSection3For(null);
    }
  };

  const loadCardSection4 = async (cardTitle: string) => {
    if (loadingSection4For !== null) return;
    const card = directionCards.find((c) => c.title === cardTitle);
    if (!card) return;
    if (card.startup_cost_usd) return; // Already loaded

    const basePayloadBase = buildBasePayload();
    if (!basePayloadBase) return;

    const cardIndex = directionCards.findIndex((c) => c.title === cardTitle);

    setLoadingSection4For(cardTitle);
    try {
      const res = await authFetch("/api/direction-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayloadBase, cardIndex, phase: 4, phase1Card: card }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { cards?: DirectionCardData[] };
      const phase4Fields = data.cards?.[0];
      if (phase4Fields) {
        const mergedCard = { ...card, ...phase4Fields };
        setDirectionCards((prev) => {
          const updated = prev.map((c) => c.title === cardTitle ? mergedCard : c);
          if (user?.uid) saveUserProfile(user.uid, { directionCards: updated });
          return updated;
        });
      }
    } finally {
      setLoadingSection4For(null);
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
    generateError,
    canGenerateMore,
    directionCardsCount: directionCards.length,
    loadCardDetail,
    loadCardSection3,
    loadCardSection4,
    loadingDetailFor,
    loadingSection3For,
    loadingSection4For,
    // Recipe staged-card flow
    generateRecipeCard,
    generatingRecipe,
    loadRecipeDetail,
    loadRecipeSection3,
    loadRecipeSection4,
    loadingRecipeDetailFor,
    loadingRecipeSection3For,
    loadingRecipeSection4For,
  };
}
