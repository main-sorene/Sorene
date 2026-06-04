"use client";

import { ArrowRight, ChevronLeft, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Separator } from "../ui/separator";

const MIE_GRADIENT = `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0, 0, 0, 0.00) 81.25%), linear-gradient(114deg, #6366f1 34.62%, #4338ca 100%)`;

const BAR_HEIGHTS = [40, 65, 50, 85, 70, 45, 75, 55];

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
      {/* Gradient header */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col", isExpanded ? "p-6 pb-8" : "p-5 pb-4")}
        style={{ background: MIE_GRADIENT }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium mb-8 w-fit"
            >
              <ChevronLeft size={18} />
              Back to summary
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Activity size={18} className="text-white" />
            </div>
            <motion.h3
              layout
              className="text-white font-semibold text-[17px] tracking-tight leading-snug"
            >
              Market Intelligence
            </motion.h3>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 text-white/60 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 ml-3">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Inactive
          </div>
        </div>

        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-[3px] h-9 mt-5"
            >
              {BAR_HEIGHTS.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
                  className="flex-1 rounded-[2px] origin-bottom"
                  style={{ height: `${h}%`, backgroundColor: "rgba(255,255,255,0.22)" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/70 text-[13px] leading-relaxed mt-4"
            >
              Continuously monitors global market signals across 8 data
              categories, identifies who is being disrupted and how, and surfaces
              personalised business opportunities matched to your DNA profile.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Collapsed white body */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            className="bg-white px-5 py-4 flex flex-col gap-4"
          >
            <p className="text-[13px] text-[#62646A] leading-relaxed">
              Continuously monitors global market signals across 8 data
              categories, identifies who is being disrupted and how, and surfaces
              personalised business opportunities matched to your DNA profile.
            </p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "8 Signal Categories", color: "#e0e7ff", text: "#4338ca" },
                  { label: "DNA-Matched", color: "#f0fdf4", text: "#166534" },
                  { label: "Real-Time", color: "#fdf4ff", text: "#7e22ce" },
                ].map(({ label, color, text }) => (
                  <span
                    key={label}
                    className="px-3 py-1 rounded-full text-[12px] font-medium"
                    style={{ backgroundColor: color, color: text }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#151515] text-[13px] font-medium border border-[#ECEDEE] hover:bg-gray-50 transition-all shadow-sm shrink-0"
              >
                See Detail
                <ArrowRight size={14} />
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
            <div className="p-4 md:p-5 space-y-8">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="text-base font-medium text-[#151515] mb-4">How It Works</h4>
                <Separator className="bg-[#ECEDEE] mb-5" />
                <div className="flex flex-wrap items-center gap-2">
                  {SIGNAL_CHAIN.map((step, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#151515]">{step}</span>
                      {idx < SIGNAL_CHAIN.length - 1 && (
                        <ArrowRight size={12} className="text-[#9A9A9A] shrink-0" />
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-[#62646A] leading-relaxed mt-4">
                  Unlike generic trend dashboards, MIE does not stop at "here is what is changing."
                  It completes the full chain — from signal to a scored, actionable opportunity
                  tailored to your skills, capital, and lifestyle.
                </p>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <h4 className="text-base font-medium text-[#151515] mb-4">What It Monitors</h4>
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
