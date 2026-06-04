"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Separator } from "../ui/separator";

const MIE_GRADIENT = `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0, 0, 0, 0.00) 81.25%), linear-gradient(114deg, #6366f1 34.62%, #4338ca 100%)`;

const DATA_CATEGORIES = [
  "Regulatory & Policy Shifts",
  "Emerging Technology Signals",
  "Consumer Behaviour Patterns",
  "Startup & VC Activity",
  "Labour Market Movements",
  "Supply Chain Disruptions",
  "Platform & Distribution Changes",
  "Macro-economic Indicators",
];

const SIGNAL_CHAIN = [
  "Signal detected",
  "Gap identified",
  "Business model generated",
  "Scored against your DNA",
  "Action path surfaced",
];

export function MarketIntelligenceCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[20px] overflow-hidden bg-white shadow-sm border border-gray-200 flex flex-col"
    >
      {/* Header */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col", isExpanded ? "p-6 pb-8" : "p-3")}
        style={{ background: isExpanded ? MIE_GRADIENT : "transparent" }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => setIsExpanded(false)}
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
            className={cn(
              "font-medium leading-snug tracking-tight",
              isExpanded
                ? "text-heading-xsmall text-white max-w-[80%]"
                : "text-body-large-medium text-[#151515] mb-4",
            )}
          >
            Market Intelligence
          </motion.h3>

          {/* Status pill */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0",
              isExpanded
                ? "bg-white/15 text-white/80"
                : "bg-[#F5F5F7] text-[#9A9A9A]",
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Inactive
          </div>
        </div>
      </motion.div>

      {/* Collapsed body */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            className="px-5 pb-5 flex flex-col flex-1"
          >
            <p className="text-label-medium text-[#62646A] leading-relaxed mb-4 line-clamp-3">
              Continuously monitors global market signals across 8 data
              categories, identifies who is being disrupted and how, and
              surfaces personalised business opportunities matched precisely to
              your DNA profile.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {["8 Signal Categories", "DNA-Matched", "Real-Time"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[#F5F5F7] text-[#62646A] text-[12px] font-medium"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>

            <div className="mt-auto flex items-center justify-end">
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#151515] text-[14px] font-medium border border-[#ECEDEE] hover:bg-gray-50 transition-all shadow-sm"
              >
                See Detail
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded content */}
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
            <div className="p-3 md:p-4 space-y-8">
              {/* Signal chain */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="text-base font-medium text-[#151515] mb-4">
                  How It Works
                </h4>
                <Separator className="bg-[#ECEDEE] mb-5" />
                <div className="flex flex-wrap items-center gap-2">
                  {SIGNAL_CHAIN.map((step, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#151515]">
                        {step}
                      </span>
                      {idx < SIGNAL_CHAIN.length - 1 && (
                        <ArrowRight size={12} className="text-[#9A9A9A]" />
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-[#62646A] leading-relaxed mt-4">
                  Unlike generic trend dashboards, MIE does not stop at "here is
                  what is changing." It completes the full chain — from signal to
                  a scored, actionable opportunity tailored to your skills,
                  capital, and lifestyle.
                </p>
              </motion.section>

              {/* Data categories */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <h4 className="text-base font-medium text-[#151515] mb-4">
                  What It Monitors
                </h4>
                <Separator className="bg-[#ECEDEE] mb-5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DATA_CATEGORIES.map((cat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.22 + idx * 0.04 }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] shrink-0" />
                      <span className="text-[13px] text-[#62646A]">{cat}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
