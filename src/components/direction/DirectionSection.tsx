"use client";

import { DirectionCard } from "./DirectionCard";
import { MarketIntelligenceCard } from "./MarketIntelligenceCard";
import { useDirectionResult } from "@/hooks/useDirectionResult";
import { useAtom } from "jotai";
import {
  ideationAtom,
  IdeationIdea,
  IdeationData,
} from "@/store/atoms";
import { useState } from "react";
import { cn } from "@/lib/utils";
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

export const DirectionSection = () => {
  const {
    directionText,
    isLoading: isDirectionLoading,
    model,
    bestCompatibility,
    otherDirections,
  } = useDirectionResult();
  const [ideation] = useAtom(ideationAtom);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const heroBadges = [
    {
      label: "Earn From Your Expertise",
      icon: <img src="/figmaAssets/wrench.svg" alt="" />,
    },
  ];

  // If we have a streamed direction from our internal API, show it in the hero card
  if (isDirectionLoading && !directionText) {
    return (
      <div className="p-3 lg:py-6 lg:px-3 space-y-4 pb-24 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Sorene is building your direction...</p>
        </div>
      </div>
    );
  }

  if (directionText) {
    return (
      <div className="p-3 lg:py-6 lg:px-3 space-y-6 pb-24">
        <section>
          <DirectionCard
            variant="hero"
            title={model || "Your Direction"}
            description={directionText}
            badges={heroBadges}
            actionText="View detail"
            score={String(bestCompatibility ?? 100)}
          />
        </section>

        {otherDirections.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-[#62646A] px-1">
              Other possible directions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherDirections.map((alt) => (
                <DirectionCard
                  key={alt.model}
                  variant="standard"
                  title={alt.model}
                  description={alt.summary || "Sorene is generating this alternative direction…"}
                  score={String(alt.compatibility)}
                  actionText="View detail"
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-medium text-[#62646A] px-1">
            Market Intelligence
          </h3>
          <MarketIntelligenceCard />
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

  return (
    <div className="p-3 lg:py-6 lg:px-3  space-y-4 pb-24">
      {/* Hero Section */}
      <section>
        {bestPickIdea && (
          <DirectionCard
            variant="hero"
            {...mapIdeaToCardProps(bestPickIdea)}
            badges={heroBadges}
            actionText="View detail"
          />
        )}
      </section>

      {/* Others Section */}
      <section>
        <h2 className="text-sm font-medium text-[#62646A] mb-4 px-2">
          Other possible directions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {otherIdeas
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
                />
              </div>
            ))}
        </div>
      </section>

      {/* Market Intelligence Section */}
      <section>
        <h2 className="text-sm font-medium text-[#62646A] mb-4 px-2">
          Market Intelligence
        </h2>
        <MarketIntelligenceCard />
      </section>
    </div>
  );
};
