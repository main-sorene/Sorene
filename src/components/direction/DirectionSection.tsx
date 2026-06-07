"use client";

import { DirectionCard } from "./DirectionCard";
import { MarketIntelligenceCard } from "./MarketIntelligenceCard";
import { ProblemToSolveCard } from "./ProblemToSolveCard";
import { useDirectionResult } from "@/hooks/useDirectionResult";
import { useAtom, useAtomValue } from "jotai";
import {
  ideationAtom,
  IdeationIdea,
  IdeationData,
  recipeDirectionsAtom,
  resourcesConstraintsAtom,
  userAtom,
  newRecipeCardIdAtom,
} from "@/store/atoms";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { cn } from "@/lib/utils"
import { ResourcesConstraintsForm } from "./ResourcesConstraintsForm";
import { useQueryClient } from "@tanstack/react-query";
const DEFAULT_IDEATION_DATA: IdeationData = {
  user_id: "dummy",
  status: "completed",
  ideation: {
    best_pick: {
      name: "The Scalable Specialist",
      reason:
        "Your combination of technical mastery and structured thinking makes you ideal for building high-ticket specialized systems.",
    },
    top_ideas: [
      {
        name: "The Scalable Specialist",
        summary:
          "Focus on building automated, high-quality systems for niche industries that value precision over speed.",
        fit_score: 98,
        why_fit: [
          "Technical Mastery: Matches your core drive for doing things right.",
          "Structure: Leverages your preference for guided frameworks.",
          "Autonomy: Allows for deep, focused independent work.",
        ],
        risks: ["Market entry timing", "Niche size limitations"],
        why_now: [
          "Increased demand for specialized automation",
          "Shift towards quality-first software",
        ],
        difficulty: "Medium",
        type: "System",
        first_validation_step:
          "Identity 3 niche sectors with high manual processes",
        validation_metric: "3 discovery interviews complete",
      },
      {
        name: "Architectural Consultant",
        summary:
          "Provide high-level guidance to early-stage teams to ensure they build on solid, scalable foundations.",
        fit_score: 92,
        why_fit: [
          "Quality Focus: Your eye for detail ensures long-term stability.",
          "Simplifying Complexity: You turn chaotic requirements into clear paths.",
        ],
        risks: [
          "High competition from large firms",
          "Difficulty in pricing expertise early",
        ],
        why_now: [
          "Rise of fractional leadership roles",
          "Technical debt is the #1 killer of startups",
        ],
        difficulty: "Medium",
        type: "Service",
        first_validation_step:
          "Create a one-pager on 'The 5 Foundation Pillars'",
        validation_metric: "5 shares or downloads",
      },
      {
        name: "Framework Builder",
        summary:
          "Develop and license specialized internal frameworks for large-scale enterprise applications.",
        fit_score: 85,
        why_fit: [
          "Logical Systems: You thrive when building order out of chaos.",
          "Scalability: Move from manual labor to intellectual property.",
        ],
        risks: ["Long sales cycles", "Maintenance overhead"],
        why_now: [
          "Enterprises are moving away from generic tools",
          "Security-first architecture is a priority",
        ],
        difficulty: "High",
        type: "Product",
        first_validation_step: "Build a prototype of the core engine",
        validation_metric: "Working proof of concept",
      },
    ],
  },
};

function HiddenCardsPills({ hiddenIds, allCards, onShow }: {
  hiddenIds: string[];
  allCards: { id: string; title: string }[];
  onShow: (id: string) => void;
}) {
  const hidden = allCards.filter((c) => hiddenIds.includes(c.id));
  if (hidden.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-[#ECEDEE]">
      <p className="text-xs text-[#9CA3AF] mb-2 px-1">Hidden directions</p>
      <div className="grid grid-cols-2 gap-2">
        {hidden.map((card) => (
          <button
            key={card.id}
            onClick={() => onShow(card.id)}
            className="px-3 py-1.5 rounded-full border border-[#ECEDEE] bg-[#F8F9FA] text-xs font-medium text-[#62646A] hover:bg-[#F1F3F5] transition-all text-left truncate"
          >
            {card.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export const DirectionSection = () => {
  const {
    primaryCard,
    altCards,
    directionText,
    isLoading: isDirectionLoading,
    model,
    bestCompatibility,
    otherDirections,
    eligibility,
    needsRC,
    generateMore,
    isGeneratingMore,
    generateError,
    canGenerateMore,
    directionCardsCount,
    newestCardTitle,
    clearNewestCard,
    loadCardDetail,
    loadCardSection3,
    loadCardSection4,
    loadingDetailFor,
    loadingSection3For,
    loadingSection4For,
    loadRecipeDetail,
    loadRecipeSection3,
    loadRecipeSection4,
    loadingRecipeDetailFor,
    loadingRecipeSection3For,
    loadingRecipeSection4For,
    generateRecipeCard,
  } = useDirectionResult();
  const [ideation] = useAtom(ideationAtom);
  const [recipeDirections, setRecipeDirections] = useAtom(recipeDirectionsAtom);
  const [newRecipeCardId, setNewRecipeCardId] = useAtom(newRecipeCardIdAtom);
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const rcForm = useAtomValue(resourcesConstraintsAtom);
  const hasRCData = Object.values(rcForm).some((v) => v.trim() !== "");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [heroRecipeId, setHeroRecipeId] = useState<string | null>(null);
  const [heroDirectionTitle, setHeroDirectionTitle] = useState<string | null>(null);

  // When the user arrives from the Execution Hub onboarding ("Check Founder &
  // Market Fit"), auto-generate a direction card once the profile is eligible.
  const searchParams = useSearchParams();
  const nextRouter = useNextRouter();
  const autoGenRef = useRef(false);
  useEffect(() => {
    if (autoGenRef.current) return;
    const urlFlagged = searchParams.get("autoGenerate") === "1";
    let storageFlagged = false;
    try { storageFlagged = sessionStorage.getItem("autoGenerateDirection") === "1"; } catch { /* ignore */ }
    if (!urlFlagged && !storageFlagged) return;
    if (!eligibility?.eligible || isGeneratingMore) return;
    autoGenRef.current = true;
    // Strip the param from the URL so a page refresh doesn't re-trigger generation
    if (urlFlagged) nextRouter.replace("/direction", { scroll: false });
    try { sessionStorage.removeItem("autoGenerateDirection"); } catch { /* ignore */ }

    let concept = "";
    try { concept = sessionStorage.getItem("onboardConcept") ?? ""; } catch { /* ignore */ }
    try { sessionStorage.removeItem("onboardConcept"); } catch { /* ignore */ }

    if (concept) {
      generateRecipeCard(concept);
    } else {
      generateMore();
    }
  }, [eligibility, isGeneratingMore, generateMore, generateRecipeCard, searchParams, nextRouter]);

  // Promote a newly added recipe card to hero and auto-expand it
  useEffect(() => {
    if (newRecipeCardId) {
      setHeroRecipeId(newRecipeCardId);
      setExpandedId(newRecipeCardId);
      setNewRecipeCardId(null);
    }
  }, [newRecipeCardId, setNewRecipeCardId]);

  // Promote a newly button-generated direction card to hero
  useEffect(() => {
    if (newestCardTitle) {
      setHeroDirectionTitle(newestCardTitle);
      setExpandedId(null);
      clearNewestCard();
    }
  }, [newestCardTitle, clearNewestCard]);
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("hiddenDirectionIds");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const hideCard = (id: string) => {
    setHiddenIds((prev) => {
      const updated = [...prev, id];
      try { localStorage.setItem("hiddenDirectionIds", JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (expandedId === id) setExpandedId(null);
  };

  const showCard = (id: string) => {
    setHiddenIds((prev) => {
      const updated = prev.filter((h) => h !== id);
      try { localStorage.setItem("hiddenDirectionIds", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Shared initial-state layout: R&C + Market Intelligence side by side
  const initialStateScreen = (
    <div className="p-3 lg:py-6 lg:px-3 pb-24">
      <div className="max-w-5xl mx-auto space-y-4 pt-6">
        {generateError && (
          <div className="rounded-xl border border-[#F3C0B8] bg-[#FDECEA] px-4 py-3 text-[13px] text-[#B42318]">
            {generateError}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <ResourcesConstraintsForm generateMore={generateMore} isGeneratingMore={isGeneratingMore} canGenerateMore={canGenerateMore} directionCardsCount={directionCardsCount} />
          <MarketIntelligenceCard onGenerateDirection={generateRecipeCard} />
          <ProblemToSolveCard onGenerateDirection={generateRecipeCard} />
        </div>
      </div>
    </div>
  );

  // R&C gate — show both cards before any directions exist
  if (needsRC) return initialStateScreen;

  // Generating spinner
  if ((isDirectionLoading || isGeneratingMore) && !directionText && !primaryCard) {
    return (
      <div className="p-3 lg:py-6 lg:px-3 space-y-4 pb-24 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Sorene is building your direction...</p>
        </div>
      </div>
    );
  }

  // Assessment complete but no directions yet — show both cards
  const hasNoDirections = !primaryCard && !directionText && recipeDirections.length === 0;
  if (!isDirectionLoading && hasNoDirections && eligibility?.eligible) {
    return initialStateScreen;
  }

  // ── New structured cards path ─────────────────────────────────────────────
  if (primaryCard) {
    const heroPrimaryId = `__primary__`;
    const primaryHidden = hiddenIds.includes(heroPrimaryId);
    const visibleAltCards = altCards.filter((c) => !hiddenIds.includes(c.title));
    const visibleRecipes = recipeDirections.filter((rd) => !hiddenIds.includes(rd.id));

    // Newest button-generated alt card gets promoted to hero slot
    const heroDirectionAlt = heroDirectionTitle && heroDirectionTitle !== primaryCard.title
      ? visibleAltCards.find((c) => c.title === heroDirectionTitle) ?? null
      : null;

    // If a recipe card was just generated from the chat bar, show it as the hero
    const heroRecipe = heroRecipeId ? visibleRecipes.find((rd) => rd.id === heroRecipeId) ?? null : null;

    // Promote first visible alt or recipe to hero if primary is hidden (and no heroRecipe/heroDirectionAlt)
    const promotedAlt = !heroRecipe && !heroDirectionAlt && primaryHidden && visibleAltCards.length > 0 ? visibleAltCards[0] : null;
    const promotedRecipe = !heroRecipe && !heroDirectionAlt && primaryHidden && !promotedAlt && visibleRecipes.length > 0 ? visibleRecipes[0] : null;
    const gridAltCards = visibleAltCards.filter((c) => c.title !== promotedAlt?.title && c.title !== heroDirectionAlt?.title);
    // heroRecipe/heroDirectionAlt go in hero slot — exclude from grid; also exclude promoted recipe
    const gridRecipes = visibleRecipes.filter((rd) => rd.id !== promotedRecipe?.id && rd.id !== heroRecipe?.id);

    const allHidden = [
      ...(primaryHidden ? [{ id: heroPrimaryId, title: primaryCard.title }] : []),
      ...altCards.filter((c) => hiddenIds.includes(c.title)).map((c) => ({ id: c.title, title: c.title })),
      ...recipeDirections.filter((rd) => hiddenIds.includes(rd.id)).map((rd) => ({ id: rd.id, title: rd.title })),
    ];

    const hasOtherDirections = gridAltCards.length > 0 || gridRecipes.length > 0;

    return (
      <div className="p-3 lg:py-6 lg:px-3 space-y-6 pb-24">
        {/* Hero — newest chat-generated card takes top slot when present */}
        <section>
          {heroDirectionAlt && (
            <DirectionCard
              variant="hero"
              title={heroDirectionAlt.title}
              description={heroDirectionAlt.description}
              actionText="See Detail"
              score={String(heroDirectionAlt.compatibility)}
              cardData={heroDirectionAlt}
              onHide={() => { hideCard(heroDirectionAlt.title); setHeroDirectionTitle(null); }}
              onLoadDetail={() => loadCardDetail(heroDirectionAlt.title)}
              onLoadSection3={() => loadCardSection3(heroDirectionAlt.title)}
              onLoadSection4={() => loadCardSection4(heroDirectionAlt.title)}
              isLoadingDetail={loadingDetailFor === heroDirectionAlt.title}
              isLoadingSection3={loadingSection3For === heroDirectionAlt.title}
              isLoadingSection4={loadingSection4For === heroDirectionAlt.title}
            />
          )}
          {heroRecipe && (
            <DirectionCard
              variant="hero"
              title={heroRecipe.title}
              description={heroRecipe.description}
              actionText="See Detail"
              score={String(heroRecipe.score)}
              whyFitsYou={heroRecipe.whyFitsYou.map((w) => ({ title: w, description: "" }))}
              keyRisks={heroRecipe.keyRisks}
              isExpanded={expandedId === heroRecipe.id}
              onToggle={() => setExpandedId(expandedId === heroRecipe.id ? null : heroRecipe.id)}
              onHide={() => { hideCard(heroRecipe.id); setHeroRecipeId(null); }}
              cardData={heroRecipe.cardData}
              onLoadDetail={heroRecipe.cardData ? () => loadRecipeDetail(heroRecipe.id) : undefined}
              onLoadSection3={heroRecipe.cardData ? () => loadRecipeSection3(heroRecipe.id) : undefined}
              onLoadSection4={heroRecipe.cardData ? () => loadRecipeSection4(heroRecipe.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === heroRecipe.id}
              isLoadingSection3={loadingRecipeSection3For === heroRecipe.id}
              isLoadingSection4={loadingRecipeSection4For === heroRecipe.id}
              rawContent={heroRecipe.rawContent}
            />
          )}
          {!primaryHidden && (
            <DirectionCard
              variant="hero"
              title={primaryCard.title}
              description={primaryCard.description}
              actionText="See Detail"
              score={String(primaryCard.compatibility)}
              cardData={primaryCard}
              onHide={() => hideCard(heroPrimaryId)}
              onLoadDetail={() => loadCardDetail(primaryCard.title)}
              onLoadSection3={() => loadCardSection3(primaryCard.title)}
              onLoadSection4={() => loadCardSection4(primaryCard.title)}
              isLoadingDetail={loadingDetailFor === primaryCard.title}
              isLoadingSection3={loadingSection3For === primaryCard.title}
              isLoadingSection4={loadingSection4For === primaryCard.title}
            />
          )}
          {promotedAlt && (
            <DirectionCard
              variant="hero"
              title={promotedAlt.title}
              description={promotedAlt.description}
              actionText="See Detail"
              score={String(promotedAlt.compatibility)}
              cardData={promotedAlt}
              onHide={() => hideCard(promotedAlt.title)}
              onLoadDetail={() => loadCardDetail(promotedAlt.title)}
              onLoadSection3={() => loadCardSection3(promotedAlt.title)}
              onLoadSection4={() => loadCardSection4(promotedAlt.title)}
              isLoadingDetail={loadingDetailFor === promotedAlt.title}
              isLoadingSection3={loadingSection3For === promotedAlt.title}
              isLoadingSection4={loadingSection4For === promotedAlt.title}
            />
          )}
          {promotedRecipe && (
            <DirectionCard
              variant="hero"
              title={promotedRecipe.title}
              description={promotedRecipe.description}

              actionText="See Detail"
              score={String(promotedRecipe.score)}
              whyFitsYou={promotedRecipe.whyFitsYou.map((w) => ({ title: w, description: "" }))}
              keyRisks={promotedRecipe.keyRisks}
              isExpanded={expandedId === promotedRecipe.id}
              onToggle={() => setExpandedId(expandedId === promotedRecipe.id ? null : promotedRecipe.id)}
              onHide={() => hideCard(promotedRecipe.id)}
              cardData={promotedRecipe.cardData}
              onLoadDetail={promotedRecipe.cardData ? () => loadRecipeDetail(promotedRecipe.id) : undefined}
              onLoadSection3={promotedRecipe.cardData ? () => loadRecipeSection3(promotedRecipe.id) : undefined}
              onLoadSection4={promotedRecipe.cardData ? () => loadRecipeSection4(promotedRecipe.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === promotedRecipe.id}
              isLoadingSection3={loadingRecipeSection3For === promotedRecipe.id}
              isLoadingSection4={loadingRecipeSection4For === promotedRecipe.id}
              rawContent={promotedRecipe.rawContent}
            />
          )}
        </section>

        {/* Other directions — alt structured + recipe cards */}
        {hasOtherDirections && (() => {
          // If any "other" card is expanded, pull it to full-width hero position
          const expandedAlt = gridAltCards.find((c) => expandedId === c.title);
          const expandedRecipe = gridRecipes.find((rd) => expandedId === rd.id);

          // Exclude cards already in hero position (promoted or expanded)
          const gridOnlyAltCards = gridAltCards.filter((c) => expandedId !== c.title);
          const gridOnlyRecipes = gridRecipes.filter((rd) => expandedId !== rd.id);
          const hasGrid = gridOnlyAltCards.length > 0 || gridOnlyRecipes.length > 0;

          return (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[#62646A] px-1">Other possible directions</h3>

              {/* Expanded card pulled to full width */}
              {expandedAlt && (
                <DirectionCard
                  key={expandedAlt.title + "-expanded"}
                  variant="hero"
                  title={expandedAlt.title}
                  description={expandedAlt.description}
                  score={String(expandedAlt.compatibility)}
                  actionText="See Detail"
                  cardData={expandedAlt}
                  isExpanded={true}
                  onToggle={() => setExpandedId(null)}
                  onHide={() => hideCard(expandedAlt.title)}
                  onLoadDetail={() => loadCardDetail(expandedAlt.title)}
                  onLoadSection3={() => loadCardSection3(expandedAlt.title)}
                  onLoadSection4={() => loadCardSection4(expandedAlt.title)}
                  isLoadingDetail={loadingDetailFor === expandedAlt.title}
                  isLoadingSection3={loadingSection3For === expandedAlt.title}
                  isLoadingSection4={loadingSection4For === expandedAlt.title}
                />
              )}
              {expandedRecipe && (
                <DirectionCard
                  key={expandedRecipe.id + "-expanded"}
                  variant="hero"
                  title={expandedRecipe.title}
                  description={expandedRecipe.description}
    
                  score={String(expandedRecipe.score)}
                  actionText="See Detail"
                  whyFitsYou={expandedRecipe.whyFitsYou.map((w) => ({ title: w, description: "" }))}
                  keyRisks={expandedRecipe.keyRisks}
                  isExpanded={true}
                  onToggle={() => setExpandedId(null)}
                  onHide={() => hideCard(expandedRecipe.id)}
                  rawContent={expandedRecipe.rawContent}
                />
              )}

              {/* Remaining cards in grid */}
              {hasGrid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gridOnlyAltCards.map((card) => (
                    <DirectionCard
                      key={card.title}
                      variant="standard"
                      title={card.title}
                      description={card.description}
                      score={String(card.compatibility)}
                      actionText="See Detail"
                      cardData={card}
                      isExpanded={false}
                      onToggle={() => setExpandedId(card.title)}
                      onHide={() => hideCard(card.title)}
                      onLoadDetail={() => loadCardDetail(card.title)}
                      onLoadSection3={() => loadCardSection3(card.title)}
                      onLoadSection4={() => loadCardSection4(card.title)}
                      isLoadingDetail={loadingDetailFor === card.title}
                      isLoadingSection3={loadingSection3For === card.title}
                      isLoadingSection4={loadingSection4For === card.title}
                    />
                  ))}
                  {gridOnlyRecipes.map((rd) => (
                    <DirectionCard
                      key={rd.id}
                      variant="standard"
                      title={rd.title}
                      description={rd.description}
                      score={String(rd.score)}
                      actionText="See Detail"
                      whyFitsYou={rd.whyFitsYou.map((w) => ({ title: w, description: "" }))}
                      keyRisks={rd.keyRisks}
                      isExpanded={false}
                      onToggle={() => setExpandedId(rd.id)}
                      onHide={() => hideCard(rd.id)}
                      cardData={rd.cardData}
              onLoadDetail={rd.cardData ? () => loadRecipeDetail(rd.id) : undefined}
              onLoadSection3={rd.cardData ? () => loadRecipeSection3(rd.id) : undefined}
              onLoadSection4={rd.cardData ? () => loadRecipeSection4(rd.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === rd.id}
              isLoadingSection3={loadingRecipeSection3For === rd.id}
              isLoadingSection4={loadingRecipeSection4For === rd.id}
              rawContent={rd.rawContent}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {allHidden.length > 0 && <HiddenCardsPills hiddenIds={hiddenIds} allCards={allHidden} onShow={showCard} />}

        <ResourcesConstraintsForm generateMore={generateMore} isGeneratingMore={isGeneratingMore} canGenerateMore={canGenerateMore} directionCardsCount={directionCardsCount} />

        <section className="space-y-3">
          <MarketIntelligenceCard onGenerateDirection={generateRecipeCard} />
          <ProblemToSolveCard onGenerateDirection={generateRecipeCard} />
        </section>
      </div>
    );
  }

  // ── Legacy streamed text path ──────────────────────────────────────────────
  if (directionText) {
    const heroHidden = hiddenIds.includes("__hero__");
    const visibleAlts = otherDirections.filter((a) => !hiddenIds.includes(a.model));
    const visibleRecipes = recipeDirections.filter((rd) => !hiddenIds.includes(rd.id));
    const legacyHeroRecipe = heroRecipeId ? visibleRecipes.find((rd) => rd.id === heroRecipeId) ?? null : null;
    // Pick the first visible card to promote when hero is hidden (native alts first, then recipes)
    const promotedAltModel: string | null = !legacyHeroRecipe && heroHidden && visibleAlts.length > 0 ? visibleAlts[0].model : null;
    const promotedRecipeId: string | null = !legacyHeroRecipe && heroHidden && !promotedAltModel && visibleRecipes.length > 0 ? visibleRecipes[0].id : null;
    const gridAlts = visibleAlts.filter((a) => a.model !== promotedAltModel);
    const gridRecipes = visibleRecipes.filter((rd) => rd.id !== promotedRecipeId && rd.id !== legacyHeroRecipe?.id);

    return (
      <div className="p-3 lg:py-6 lg:px-3 space-y-6 pb-24">
        <section>
          {legacyHeroRecipe && (
            <DirectionCard
              variant="hero"
              title={legacyHeroRecipe.title}
              description={legacyHeroRecipe.description}
              actionText="See Detail"
              score={String(legacyHeroRecipe.score)}
              whyFitsYou={legacyHeroRecipe.whyFitsYou.map((w) => ({ title: w, description: "" }))}
              keyRisks={legacyHeroRecipe.keyRisks}
              isExpanded={expandedId === legacyHeroRecipe.id}
              onToggle={() => setExpandedId(expandedId === legacyHeroRecipe.id ? null : legacyHeroRecipe.id)}
              onHide={() => { hideCard(legacyHeroRecipe.id); setHeroRecipeId(null); }}
              cardData={legacyHeroRecipe.cardData}
              onLoadDetail={legacyHeroRecipe.cardData ? () => loadRecipeDetail(legacyHeroRecipe.id) : undefined}
              onLoadSection3={legacyHeroRecipe.cardData ? () => loadRecipeSection3(legacyHeroRecipe.id) : undefined}
              onLoadSection4={legacyHeroRecipe.cardData ? () => loadRecipeSection4(legacyHeroRecipe.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === legacyHeroRecipe.id}
              isLoadingSection3={loadingRecipeSection3For === legacyHeroRecipe.id}
              isLoadingSection4={loadingRecipeSection4For === legacyHeroRecipe.id}
              rawContent={legacyHeroRecipe.rawContent}
            />
          )}
          {!heroHidden && (
            <DirectionCard
              variant="hero"
              title={model || "Your Direction"}
              description={directionText}

              actionText="See Detail"
              score={String(bestCompatibility ?? 100)}
              onHide={() => hideCard("__hero__")}
            />
          )}
          {promotedAltModel && (() => { const a = visibleAlts.find(x => x.model === promotedAltModel)!; return (
            <DirectionCard
              variant="hero"
              title={a.model}
              description={a.summary || ""}

              actionText="See Detail"
              score={String(a.compatibility)}
              onHide={() => hideCard(a.model)}
            />
          ); })()}
          {promotedRecipeId && (() => { const rd = visibleRecipes.find(x => x.id === promotedRecipeId)!; return (
            <DirectionCard
              variant="hero"
              title={rd.title}
              description={rd.description}

              actionText="See Detail"
              score={String(rd.score)}
              whyFitsYou={rd.whyFitsYou.map((w) => ({ title: w, description: "" }))}
              keyRisks={rd.keyRisks}
              recommendedFirstStep={rd.firstStep ? { progress: 0, steps: [{ id: "1", label: rd.firstStep, completed: false }] } : undefined}
              isExpanded={expandedId === rd.id}
              onToggle={() => setExpandedId(expandedId === rd.id ? null : rd.id)}
              onHide={() => hideCard(rd.id)}
              cardData={rd.cardData}
              onLoadDetail={rd.cardData ? () => loadRecipeDetail(rd.id) : undefined}
              onLoadSection3={rd.cardData ? () => loadRecipeSection3(rd.id) : undefined}
              onLoadSection4={rd.cardData ? () => loadRecipeSection4(rd.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === rd.id}
              isLoadingSection3={loadingRecipeSection3For === rd.id}
              isLoadingSection4={loadingRecipeSection4For === rd.id}
              rawContent={rd.rawContent}
            />
          ); })()}
        </section>

        {(otherDirections.length > 0 || recipeDirections.length > 0 || heroHidden) && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-[#62646A] px-1">
              Other possible directions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gridAlts.map((alt) => (
                <DirectionCard
                  key={alt.model}
                  variant="standard"
                  title={alt.model}
                  description={alt.summary || "Sorene is generating this alternative direction…"}
                  score={String(alt.compatibility)}
                  actionText="See Detail"
                  onHide={() => hideCard(alt.model)}
                />
              ))}
              {gridRecipes.map((rd) => (
                <div
                  key={rd.id}
                  className={cn("transition-all duration-500", expandedId === rd.id ? "col-span-1 sm:col-span-2" : "col-span-1")}
                >
                  <DirectionCard
                    variant="standard"
                    title={rd.title}
                    description={rd.description}
                    score={String(rd.score)}
                    whyFitsYou={rd.whyFitsYou.map((w) => ({ title: w, description: "" }))}
                    keyRisks={rd.keyRisks}
                    recommendedFirstStep={rd.firstStep ? { progress: 0, steps: [{ id: "1", label: rd.firstStep, completed: false }] } : undefined}
                    actionText="See Detail"
                    isExpanded={expandedId === rd.id}
                    onToggle={() => setExpandedId(expandedId === rd.id ? null : rd.id)}
                    onHide={() => hideCard(rd.id)}
              cardData={rd.cardData}
              onLoadDetail={rd.cardData ? () => loadRecipeDetail(rd.id) : undefined}
              onLoadSection3={rd.cardData ? () => loadRecipeSection3(rd.id) : undefined}
              onLoadSection4={rd.cardData ? () => loadRecipeSection4(rd.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === rd.id}
              isLoadingSection3={loadingRecipeSection3For === rd.id}
              isLoadingSection4={loadingRecipeSection4For === rd.id}
              rawContent={rd.rawContent}
                  />
                </div>
              ))}
            </div>
            <HiddenCardsPills hiddenIds={hiddenIds} allCards={[
              { id: "__hero__", title: model || "Your Direction" },
              ...otherDirections.map((a) => ({ id: a.model, title: a.model })),
              ...recipeDirections.map((rd) => ({ id: rd.id, title: rd.title })),
            ]} onShow={showCard} />
          </section>
        )}

        <ResourcesConstraintsForm generateMore={generateMore} isGeneratingMore={isGeneratingMore} canGenerateMore={canGenerateMore} directionCardsCount={directionCardsCount} />

        <section className="space-y-3">
          <MarketIntelligenceCard onGenerateDirection={generateRecipeCard} />
          <ProblemToSolveCard onGenerateDirection={generateRecipeCard} />
        </section>
      </div>
    );
  }

  const currentIdeation = ideation || DEFAULT_IDEATION_DATA;
  const bestPickName = currentIdeation?.ideation?.best_pick?.name;
  const topIdeas = currentIdeation?.ideation?.top_ideas || [];

  const bestPickIdea =
    topIdeas.find((i) => i.name === bestPickName) || topIdeas[0];
  const otherIdeas = topIdeas.filter(
    (i) => i.name !== (bestPickIdea?.name || bestPickName),
  );

  const mapIdeaToCardProps = (idea: IdeationIdea) => ({
    title: idea.name,
    description: idea.summary,
    score: idea.fit_score.toString(),
    whyFitsYou: idea.why_fit.map((text) => {
      const parts = text.split(":");
      const title = parts.length > 1 ? parts[0].trim() : "Fit logic";
      const description =
        parts.length > 1 ? parts.slice(1).join(":").trim() : text.trim();
      return { title, description };
    }),
    keyRisks: idea.risks,
    whyNowWorks: idea.why_now.join(" "),
    recommendedFirstStep: {
      progress: 0,
      steps: [
        {
          id: "1",
          label: idea.first_validation_step,
          completed: false,
        },
      ],
    },
    successMetric: idea.validation_metric,
  });

  const handleToggle = (name: string) => {
    setExpandedId(expandedId === name ? null : name);
  };

  // Determine hero: original if not hidden, else first visible native idea, else first visible recipe
  const heroIsHidden = bestPickIdea ? hiddenIds.includes(bestPickIdea.name) : false;
  const visibleOtherIdeas = otherIdeas.filter((i) => !hiddenIds.includes(i.name));
  const visibleRecipeCards = recipeDirections.filter((rd) => !hiddenIds.includes(rd.id));
  const ideationHeroRecipe = heroRecipeId ? visibleRecipeCards.find((rd) => rd.id === heroRecipeId) ?? null : null;
  const promotedHeroIdeaName: string | null = !ideationHeroRecipe && heroIsHidden && visibleOtherIdeas.length > 0 ? visibleOtherIdeas[0].name : null;
  const promotedHeroRecipeId: string | null = !ideationHeroRecipe && heroIsHidden && !promotedHeroIdeaName && visibleRecipeCards.length > 0 ? visibleRecipeCards[0].id : null;
  const displayedHero = heroIsHidden ? (visibleOtherIdeas[0] ?? null) : (bestPickIdea ?? null);
  const gridIdeas = visibleOtherIdeas.filter((i) => i.name !== promotedHeroIdeaName);
  const gridRecipeCards = visibleRecipeCards.filter((rd) => rd.id !== promotedHeroRecipeId && rd.id !== ideationHeroRecipe?.id);

  return (
    <div className="p-3 lg:py-6 lg:px-3 space-y-4 pb-24">
      {/* Hero Section */}
      <section>
        {ideationHeroRecipe && (
          <DirectionCard
            variant="hero"
            title={ideationHeroRecipe.title}
            description={ideationHeroRecipe.description}
            actionText="See Detail"
            score={String(ideationHeroRecipe.score)}
            whyFitsYou={ideationHeroRecipe.whyFitsYou.map((w) => ({ title: w, description: "" }))}
            keyRisks={ideationHeroRecipe.keyRisks}
            isExpanded={expandedId === ideationHeroRecipe.id}
            onToggle={() => setExpandedId(expandedId === ideationHeroRecipe.id ? null : ideationHeroRecipe.id)}
            onHide={() => { hideCard(ideationHeroRecipe.id); setHeroRecipeId(null); }}
            cardData={ideationHeroRecipe.cardData}
            onLoadDetail={ideationHeroRecipe.cardData ? () => loadRecipeDetail(ideationHeroRecipe.id) : undefined}
            onLoadSection3={ideationHeroRecipe.cardData ? () => loadRecipeSection3(ideationHeroRecipe.id) : undefined}
            onLoadSection4={ideationHeroRecipe.cardData ? () => loadRecipeSection4(ideationHeroRecipe.id) : undefined}
            isLoadingDetail={loadingRecipeDetailFor === ideationHeroRecipe.id}
            isLoadingSection3={loadingRecipeSection3For === ideationHeroRecipe.id}
            isLoadingSection4={loadingRecipeSection4For === ideationHeroRecipe.id}
            rawContent={ideationHeroRecipe.rawContent}
          />
        )}
        {displayedHero && (
          <DirectionCard
            variant="hero"
            {...mapIdeaToCardProps(displayedHero)}
            actionText="See Detail"
            onHide={() => hideCard(displayedHero.name)}
          />
        )}
        {promotedHeroRecipeId && (() => { const rd = visibleRecipeCards.find(x => x.id === promotedHeroRecipeId)!; return (
          <DirectionCard
            variant="hero"
            title={rd.title}
            description={rd.description}
            actionText="See Detail"
            score={String(rd.score)}
            whyFitsYou={rd.whyFitsYou.map((w) => ({ title: w, description: "" }))}
            keyRisks={rd.keyRisks}
            recommendedFirstStep={rd.firstStep ? { progress: 0, steps: [{ id: "1", label: rd.firstStep, completed: false }] } : undefined}
            isExpanded={expandedId === rd.id}
            onToggle={() => setExpandedId(expandedId === rd.id ? null : rd.id)}
            onHide={() => hideCard(rd.id)}
              cardData={rd.cardData}
              onLoadDetail={rd.cardData ? () => loadRecipeDetail(rd.id) : undefined}
              onLoadSection3={rd.cardData ? () => loadRecipeSection3(rd.id) : undefined}
              onLoadSection4={rd.cardData ? () => loadRecipeSection4(rd.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === rd.id}
              isLoadingSection3={loadingRecipeSection3For === rd.id}
              isLoadingSection4={loadingRecipeSection4For === rd.id}
              rawContent={rd.rawContent}
          />
        ); })()}
      </section>

      {/* Others Section */}
      <section>
        <h2 className="text-sm font-medium text-[#62646A] mb-4 px-2">
          Other possible directions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gridIdeas
            .filter((idea) => !expandedId || expandedId === idea.name)
            .map((idea) => (
              <div
                key={idea.name}
                className={cn(
                  "transition-all duration-500",
                  expandedId === idea.name
                    ? "col-span-1 md:col-span-2"
                    : "col-span-1",
                )}
              >
                <DirectionCard
                  {...mapIdeaToCardProps(idea)}
                  isExpanded={expandedId === idea.name}
                  onToggle={() => handleToggle(idea.name)}
                  onHide={() => hideCard(idea.name)}
                />
              </div>
            ))}
          {gridRecipeCards.map((rd) => (
            <div
              key={rd.id}
              className={cn("transition-all duration-500", expandedId === rd.id ? "col-span-1 md:col-span-2" : "col-span-1")}
            >
              <DirectionCard
                variant="standard"
                title={rd.title}
                description={rd.description}
                score={String(rd.score)}
                whyFitsYou={rd.whyFitsYou.map((w) => ({ title: w, description: "" }))}
                keyRisks={rd.keyRisks}
                recommendedFirstStep={rd.firstStep ? { progress: 0, steps: [{ id: "1", label: rd.firstStep, completed: false }] } : undefined}
                actionText="See Detail"
                isExpanded={expandedId === rd.id}
                onToggle={() => setExpandedId(expandedId === rd.id ? null : rd.id)}
                onHide={() => hideCard(rd.id)}
              cardData={rd.cardData}
              onLoadDetail={rd.cardData ? () => loadRecipeDetail(rd.id) : undefined}
              onLoadSection3={rd.cardData ? () => loadRecipeSection3(rd.id) : undefined}
              onLoadSection4={rd.cardData ? () => loadRecipeSection4(rd.id) : undefined}
              isLoadingDetail={loadingRecipeDetailFor === rd.id}
              isLoadingSection3={loadingRecipeSection3For === rd.id}
              isLoadingSection4={loadingRecipeSection4For === rd.id}
              rawContent={rd.rawContent}
              />
            </div>
          ))}
        </div>
        <HiddenCardsPills hiddenIds={hiddenIds} allCards={[
          ...(bestPickIdea ? [{ id: bestPickIdea.name, title: bestPickIdea.name }] : []),
          ...otherIdeas.map((i) => ({ id: i.name, title: i.name })),
          ...recipeDirections.map((rd) => ({ id: rd.id, title: rd.title })),
        ]} onShow={showCard} />
      </section>

      <ResourcesConstraintsForm generateMore={generateMore} isGeneratingMore={isGeneratingMore} canGenerateMore={canGenerateMore} directionCardsCount={directionCardsCount} />

      <section className="space-y-3">
        <MarketIntelligenceCard onGenerateDirection={generateRecipeCard} />
        <ProblemToSolveCard onGenerateDirection={generateRecipeCard} />
      </section>
    </div>
  );
};
