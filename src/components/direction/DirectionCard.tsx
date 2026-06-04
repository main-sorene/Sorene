"use client";

import {
  ArrowRight,
  Check,
  ChevronLeft,
  CircleCheck,
  CircleX,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "../ui/separator";

interface Badge {
  label: string;
  icon?: React.ReactNode;
}

interface WhyFitsItem {
  title: string;
  description: string;
}

interface FirstStep {
  id: string;
  label: string;
  completed?: boolean;
}

interface DirectionCardProps {
  title: string;
  description: string;
  gradient?: string;
  variant?: "hero" | "standard";
  score?: string;
  badges?: Badge[];
  actionText?: string;
  className?: string;
  whyFitsYou?: WhyFitsItem[];
  keyRisks?: string[];
  whyNowWorks?: string;
  recommendedFirstStep?: {
    progress: number;
    steps: FirstStep[];
  };
  successMetric?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  onHide?: () => void;
  rawContent?: string;
}

export function DirectionCard({
  title,
  description,
  variant = "standard",
  score,
  badges,
  actionText = "View detail",
  className,
  whyFitsYou = [
    {
      title: "Mastery, not speed",
      description:
        "You're motivated by doing deep, quality work. This direction is built around diagnostic depth, not volume.",
    },
    {
      title: "Solo, async by default",
      description:
        "You said extensive social interaction drains you. This defaults to async: intake forms in, reports out.",
    },
    {
      title: "Low financial risk",
      description:
        "No upfront capital. No team. Start with one package and measure interest before committing.",
    },
    {
      title: "Fits your time capacity",
      description:
        "1-2 audits per month is realistic with medium time availability.",
    },
  ],
  keyRisks = [
    "Income is directly tied to hours without a clear path to scale",
    "Positioning may be too generic without a defined sub-domain",
    "Client availability expectations may conflict with your schedule",
  ],
  whyNowWorks = "The fractional executive model is rapidly normalizing — startups and SMBs increasingly prefer part-time senior hires over expensive full-time roles. Economic tightening is pushing more companies to seek experienced guidance without full-time overhead. AI tools are making execution cheaper, which increases demand for strategic direction over tactical labor.",
  recommendedFirstStep = {
    progress: 40,
    steps: [
      {
        id: "1",
        label:
          'Define the scope (e.g., "operational system audit for solo consultants")',
        completed: true,
      },
      {
        id: "2",
        label: "Create a structured intake form with 10-15 questions",
        completed: false,
      },
      {
        id: "3",
        label: "Write a sample audit report using a hypothetical case",
        completed: false,
      },
      {
        id: "4",
        label: "Publish as a page or PDF. No paid promotion.",
        completed: false,
      },
    ],
  },
  successMetric = "Organic requests within 30 days",
  isExpanded: isExpandedProp,
  onToggle,
  onHide,
  rawContent,
}: DirectionCardProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<string[]>(
    recommendedFirstStep.steps
      .filter((step) => step.completed)
      .map((step) => step.id),
  );

  const isExpanded = isExpandedProp ?? internalIsExpanded;

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  const getScoreColor = (score: string) => {
    const value = parseInt(score);
    if (value >= 70) return "#32C382";
    if (value >= 40) return "#F5B100";
    return "#DF2E16";
  };

  const getScoreGradient = (score?: string): string => {
    if (!score) {
      return `
      radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0, 0, 0, 0.00) 81.25%), linear-gradient(114deg, var(--lime-400, #A3E635) 34.62%, var(--green-500, #16B364) 100%)
    `;
    }

    const value = parseInt(score);

    let c1 = "#A3E635";
    let c2 = "#16B364";

    if (value >= 70) {
      c1 = "#A3E635";
      c2 = "#16B364";
    } else if (value >= 40) {
      c1 = "#FAC515";
      c2 = "#EF6820";
    } else {
      c1 = "#F38744";
      c2 = "#EF4444";
    }

    return `
    radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0, 0, 0, 0.00) 81.25%), linear-gradient(114deg, var(--lime-400, ${c1}) 34.62%, var(--green-500, ${c2}) 100%)
  `;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "#32C382";
    if (progress >= 40) return "#FFC01F";
    return "#DF2E16";
  };

  const toggleStep = (stepId: string) => {
    setCheckedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId],
    );
  };

  // Render raw markdown-like content (bold, headers, bullets) as readable HTML
  const renderRaw = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 text-sm text-[#374151] leading-relaxed">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-2" />;
          // Section headers (## or bold-only lines)
          if (/^\*{2}[^*]+\*{2}$/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
            const label = trimmed.replace(/^\*{2}|\*{2}$|^#{1,3}\s/g, "").trim();
            return <p key={i} className="font-semibold text-[#111111] mt-4 first:mt-0">{label}</p>;
          }
          // Bullet points
          if (/^[-*•]\s/.test(trimmed)) {
            const content = trimmed.replace(/^[-*•]\s/, "");
            const parts = content.split(/(\*\*.*?\*\*)/g);
            return (
              <div key={i} className="flex gap-2">
                <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                <span>{parts.map((p, j) => p.startsWith("**") && p.endsWith("**")
                  ? <strong key={j} className="text-[#111111]">{p.slice(2, -2)}</strong>
                  : <span key={j}>{p}</span>
                )}</span>
              </div>
            );
          }
          // Numbered list
          if (/^\d+\.\s/.test(trimmed)) {
            const [num, ...rest] = trimmed.split(/\.\s/);
            const content = rest.join(". ");
            const parts = content.split(/(\*\*.*?\*\*)/g);
            return (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 font-medium text-[#6B7280]">{num}.</span>
                <span>{parts.map((p, j) => p.startsWith("**") && p.endsWith("**")
                  ? <strong key={j} className="text-[#111111]">{p.slice(2, -2)}</strong>
                  : <span key={j}>{p}</span>
                )}</span>
              </div>
            );
          }
          // Normal line with inline bold
          const parts = trimmed.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={i}>{parts.map((p, j) => p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} className="text-[#111111]">{p.slice(2, -2)}</strong>
              : <span key={j}>{p}</span>
            )}</p>
          );
        })}
      </div>
    );
  };

  const expandedDetailContent = rawContent ? (
    <div className="p-4 md:p-6">
      {renderRaw(rawContent)}
    </div>
  ) : (
    <div className="p-3 md:p-4 space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Why This Fits You */}
          <div className="flex-1">
            <h4 className="text-base font-medium text-[#151515] mb-4">
              Why This Fits You
            </h4>
            <Separator className="bg-[#ECEDEE] mb-5" />
            <div className="space-y-4">
              {whyFitsYou.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="flex gap-4 items-center"
                >
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    <CircleCheck size={20} className="text-[#32C382]" />
                  </div>
                  <div>
                    <h5 className="text-[14px] font-medium text-[#151515] mb-0.5">
                      {item.title}
                    </h5>
                    <p className="text-[13px] text-[#62646A] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Key Risks */}
          <div className="flex-1">
            <h4 className="text-base font-medium text-[#151515] mb-4">
              Key Risks
            </h4>
            <Separator className="bg-[#ECEDEE] mb-5" />
            <div className="space-y-2">
              {keyRisks.map((risk, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="flex gap-4 items-center"
                >
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    <CircleX size={20} className="text-[#DF2E16]" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{risk}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Now Works */}
        <div className="mt-8">
          <h4 className="text-base font-medium text-[#151515] mb-3">
            Why Now Works
          </h4>
          <Separator className="bg-[#ECEDEE] mb-5" />
          <p className="text-[13px] text-[#62646A] leading-relaxed">
            {whyNowWorks}
          </p>
        </div>
      </motion.section>

      {/* Recommended First Step */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-[17px] font-semibold text-[#151515]">
            Recommend First Step
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-[#FFEEC2] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${recommendedFirstStep.progress}%` }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: getProgressColor(
                    recommendedFirstStep.progress,
                  ),
                }}
              />
            </div>
            <span className="text-[13px] text-[#62646A] font-medium">
              {recommendedFirstStep.progress}%
            </span>
          </div>
        </div>

        <Separator className="bg-[#ECEDEE] mb-5" />

        <div className="space-y-3">
          {recommendedFirstStep.steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="flex items-start gap-3"
            >
              <Checkbox
                id={`${title}-${step.id}`}
                checked={checkedSteps.includes(step.id)}
                onCheckedChange={() => toggleStep(step.id)}
                className="
                  mt-0.5
                  border-[#151515]
                  data-[state=checked]:bg-[#151515]
                  data-[state=checked]:border-[#151515]
                  data-[state=checked]:text-white
                "
              />
              <label
                htmlFor={`${title}-${step.id}`}
                className={cn(
                  "text-[14px] font-medium leading-relaxed cursor-pointer transition-all",
                  checkedSteps.includes(step.id)
                    ? "text-[#9A9A9A] line-through"
                    : "text-[#151515]",
                )}
              >
                {step.label}
              </label>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-5 pt-4 border-t border-[#ECECEC]"
        >
          <span className="text-[12px] text-[#9A9A9A] font-medium block mb-1">
            Success metric
          </span>
          <span className="text-[14px] text-[#32C382] font-medium">
            {successMetric}
          </span>
        </motion.div>
      </motion.section>
    </div>
  );

  if (variant === "hero") {
    return (
      <motion.div
        layout
        transition={{
          layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        }}
        className={cn(
          "relative rounded-4xl overflow-hidden bg-white shadow-sm border border-gray-100 flex flex-col",
          className,
        )}
      >
        {/* Top Gradient Section */}
        <motion.div
          layout
          transition={{
            layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
          }}
          className="p-6 flex flex-col"
          style={{
            background: getScoreGradient(score),
          }}
        >
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={(e) => handleToggle(e)}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium mb-8 w-fit"
              >
                <ChevronLeft size={20} />
                Back to summary
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-start">
            <motion.h3
              layout
              className={`text-heading-xsmall font-medium text-white leading-[1.2] max-w-[80%] tracking-tight ${
                !isExpanded ? "line-clamp-1" : ""
              }`}
            >
              {title}
            </motion.h3>

            {score && (
              <motion.div layout className="text-right">
                <div className="text-[32px] font-medium text-white leading-none">
                  {score}%
                </div>
                <div className="text-[11px] text-white/70 font-medium mt-1">
                  Compatibility
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Body Section */}
        <motion.div
          layout="position"
          className="bg-white p-4 flex flex-col gap-4"
        >
          <motion.p
            layout="position"
            className="text-[#62646A] text-body-small leading-relaxed line-clamp-2 max-w-full"
          >
            {description}
          </motion.p>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {badges?.map((badge, idx) => (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] text-[#151515] text-[13px] font-medium"
                >
                  {badge.icon || <Check size={14} />}
                  {badge.label}
                </motion.div>
              ))}
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CEF2E2] text-[#196141] text-[13px] font-medium"
              >
                Easy to start
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {!isExpanded && (
                <div className="flex items-center gap-2">
                  {onHide && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onHide(); }}
                      className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors font-medium"
                    >
                      Hide
                    </button>
                  )}
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => handleToggle(e)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#151515] text-[14px] font-medium border border-[#ECEDEE] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <motion.span
                    key="view"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    {actionText}
                    <ArrowRight size={16} />
                  </motion.span>
                </motion.button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Expanded Detail Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { type: "spring", stiffness: 400, damping: 40 },
                opacity: { duration: 0.2 },
              }}
              className="overflow-hidden bg-white"
            >
              {expandedDetailContent}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Standard variant — mirrors hero structure
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className={cn(
        "relative rounded-[20px] overflow-hidden bg-white shadow-sm border border-gray-200 flex flex-col",
        !isExpanded && "min-h-35 cursor-pointer",
        className,
      )}
    >
      {/* Gradient header section */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col", isExpanded ? "p-6 pb-8" : "p-3")}
        style={{
          background: isExpanded ? getScoreGradient(score) : "transparent",
        }}
        onClick={!isExpanded ? (e) => handleToggle(e) : undefined}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center justify-between mb-8"
            >
              <button
                onClick={(e) => handleToggle(e)}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium w-fit"
              >
                <ChevronLeft size={20} />
                Back to summary
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-white"
              >
                <MoreHorizontal size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-start">
          <h3
            className={cn(
              "font-medium leading-snug tracking-tight line-clamp-2",
              isExpanded
                ? "text-heading-xsmall text-white max-w-[80%]"
                : "text-body-large-medium text-[#151515] pr-6 mb-4",
            )}
          >
            {title}
          </h3>
          {score && (
            <div className={cn("flex flex-col", "text-right")}>
              <div
                className={
                  isExpanded
                    ? "text-[32px] font-medium text-white leading-none"
                    : "text-body-large-medium"
                }
                style={{ color: isExpanded ? undefined : getScoreColor(score) }}
              >
                {/* {isExpanded ? `${score}%` : score} */}
                {score}%
              </div>
              <div
                className={
                  isExpanded
                    ? "text-[11px] text-white/70 font-medium mt-1"
                    : "text-[10px] text-[#62646A] font-medium"
                }
              >
                Compatibility
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/80 text-sm leading-relaxed mt-4"
            >
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Collapsed body — description + action button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            className="px-5 pb-5 flex flex-col flex-1"
            onClick={(e) => handleToggle(e)}
          >
            <p className="text-label-medium text-[#62646A] leading-relaxed mb-4 line-clamp-3">
              {description}
            </p>
            <div className="mt-auto flex items-center justify-between">
              {onHide ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onHide(); }}
                  className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors font-medium"
                >
                  Hide
                </button>
              ) : <div />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(e);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#151515] text-[14px] font-medium border border-[#ECEDEE] hover:bg-gray-50 transition-all shadow-sm"
              >
                {actionText}
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded detail content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: "spring", stiffness: 400, damping: 40 },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden bg-white"
          >
            {expandedDetailContent}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
