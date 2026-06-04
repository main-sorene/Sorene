"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { KeySignal } from "@/lib/dnaMapping";

interface Badge {
  label: string;
  color?: string; // Hex or tailwind class
}

interface Signal {
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}

interface DNACardProps {
  title: string;
  description: string;
  gradient: string;
  icon: string;
  variant?: "hero" | "standard";
  badges?: Badge[];
  signals?: Signal[]; // Fallback for old usage
  keySignals?: KeySignal[];
  strengthPatterns?: string[];
  blindSpots?: string[];
  riskExamples?: string[];
  heroStatement?: string;
  actionText?: string;
  isLarge?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

export function DNACard({
  title,
  description,
  gradient,
  icon,
  variant = "standard",
  badges,
  signals,
  keySignals,
  strengthPatterns,
  blindSpots,
  riskExamples,
  heroStatement,
  actionText = "View detail",
  isLarge = false,
  isExpanded: isExpandedProp,
  onToggle,
  onClick,
}: DNACardProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);

  const isExpanded = isExpandedProp ?? internalIsExpanded;
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsExpanded(!isExpanded);
    }
  };

  const gradientStyle = {
    background: isExpanded || variant === "hero" ? gradient : "white",
  };

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className={cn(
        "relative rounded-[32px] overflow-hidden shadow-sm border border-gray-100 flex flex-col cursor-pointer transition-colors duration-300",
        isExpanded ? "bg-white shadow-lg w-full" : "bg-white",
        !isExpanded &&
          variant === "standard" &&
          (isLarge ? "min-h-[242px]" : "min-h-[242px]"),
        !isExpanded && variant === "hero" && isLarge && "min-h-[280px]",
      )}
      style={gradientStyle}
      onClick={!isExpanded ? handleToggle : undefined}
    >
      {/* Spotlight Overlay for Hero cards */}
      {variant === "hero" && !isExpanded && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.4)_0%,transparent_75%)] pointer-events-none z-0" />
      )}
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col w-full"
          >
            {/* Expanded Gradient Header */}
            <div
              className="p-6 pb-4 flex flex-col"
              style={{ background: gradient }}
            >
              <div className="flex items-center justify-between gap-4 mb-7">
                {/* Back Button */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(e);
                  }}
                  className="flex items-center gap-2 text-white hover:text-white transition-colors text-body-small-medium w-fit"
                >
                  <ChevronLeft size={20} />
                  Back to summary
                </motion.button>

                {/* More Button */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-2 text-white hover:text-white transition-colors text-sm font-medium w-fit"
                >
                  <MoreHorizontal size={20} />
                </motion.button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <img
                  src={icon}
                  className="w-10 h-10 invert brightness-0"
                  alt=""
                />
                <h2 className="text-heading-small text-white tracking-tight">
                  {title}
                </h2>
              </div>

              <p className="text-white text-label-medium leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>

            {/* White Body Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white"
            >
              <DetailContent
                heroStatement={heroStatement}
                keySignals={keySignals}
                strengthPatterns={strengthPatterns}
                blindSpots={blindSpots}
                riskExamples={riskExamples}
              />
            </motion.div>
          </motion.div>
        ) : variant === "hero" ? (
          <motion.div
            key="hero-summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full flex-1 justify-between w-full"
          >
            <div className="p-8 pb-0 flex  justify-between relative z-20">
              <div className="flex items-center gap-3">
                <img
                  src={icon}
                  className="w-8 h-8 invert brightness-0"
                  alt=""
                />
                <h3 className="text-heading-xsmall font-medium text-white tracking-tight leading-tight">
                  {title}
                </h3>
              </div>
              <div className="pt-2">
                <ChevronRight size={16} className="text-white" />
              </div>
            </div>

            <div className="p-8 pb-10 relative z-20 flex flex-col gap-2">
              {heroStatement && (
                <p
                  className="text-white font-medium leading-snug tracking-tight"
                  style={{ fontSize: "22px" }}
                >
                  {heroStatement}
                </p>
              )}
              <p className="text-white text-label-medium leading-relaxed max-w-[85%] opacity-80">
                {description}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="standard-summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full flex-1 w-full"
          >
            {/* Header Section */}
            <div className="pt-4 pb-2 px-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={icon} className="w-6 h-6" alt="" />
                  <h3 className="text-body-large-medium font-medium text-[#151515]">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(e);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-100 bg-white text-[12px] font-medium text-[#151515] hover:bg-gray-50 transition-all shadow-sm w-fit"
                >
                  {actionText}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-6 pt-2 flex flex-col flex-1">
              <p className="text-[#62646A] text-label-medium leading-relaxed">
                {description}
              </p>

              {badges && badges.length > 0 && (
                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-body-xsmall-medium"
                      style={{
                        backgroundColor: badge.color
                          ? `${badge.color}20`
                          : "#F3F4F6",
                        color: badge.color || "#6B7280",
                      }}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailContent({
  heroStatement,
  keySignals,
  strengthPatterns,
  blindSpots,
  riskExamples,
}: {
  heroStatement?: string;
  keySignals?: KeySignal[];
  strengthPatterns?: string[];
  blindSpots?: string[];
  riskExamples?: string[];
}) {
  return (
    <div className="p-6 space-y-12">
      {/* {heroStatement && (
        <section>
          <div className="text-heading-small text-[#151515] mb-2">
            {heroStatement}
          </div>
          <Separator className="bg-gray-100 mt-6" />
        </section>
      )} */}

      {keySignals && keySignals.length > 0 && (
        <section>
          <h4 className="text-body-medium-medium text-[#151515] mb-6 tracking-widest uppercase">
            Key Signals
          </h4>
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {keySignals.map((signal, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row md:items-start py-4"
              >
                <div className="w-64 shrink-0 mb-2 md:mb-0">
                  <span className="text-body-small-medium text-[#62646A]">
                    {signal.label}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-heading-xsmall mb-2 text-[#151515]">
                    {signal.value}
                  </div>
                  {signal.explanation && (
                    <p className="text-body-small text-[#62646A] leading-relaxed max-w-2xl">
                      {signal.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {strengthPatterns && strengthPatterns.length > 0 && (
        <section className="pt-8 border-t border-gray-100">
          <h4 className="text-body-medium-medium text-[#151515] mb-6 tracking-widest uppercase">
            Strength Patterns
          </h4>
          <div className="flex flex-wrap gap-3">
            {strengthPatterns.map((pattern, idx) => (
              <div
                key={idx}
                className="px-5 py-2.5 rounded-full border border-[#32C382] bg-[#F5FFD9] text-[#151515] text-body-small-medium shadow-sm"
              >
                {pattern}
              </div>
            ))}
          </div>
        </section>
      )}

      {blindSpots && blindSpots.length > 0 && (
        <section className="pt-8 border-t border-gray-100">
          <h4 className="text-body-medium-medium text-[#151515] mb-6 tracking-widest uppercase">
            Blind Spots
          </h4>
          <div className="flex flex-wrap gap-3">
            {blindSpots.map((spot, idx) => (
              <div
                key={idx}
                className="px-5 py-2.5 rounded-full border border-red-200 bg-red-50 text-[#151515] text-body-small-medium shadow-sm"
              >
                {spot}
              </div>
            ))}
          </div>
        </section>
      )}

      {riskExamples && riskExamples.length > 0 && (
        <section className="pt-8 border-t border-gray-100">
          <h4 className="text-body-medium-medium text-[#151515] mb-6 tracking-widest uppercase">
            Risk Examples
          </h4>
          <div className="space-y-4">
            {riskExamples.map((example, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                <p className="text-body-small text-[#62646A] leading-relaxed">
                  {example}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
