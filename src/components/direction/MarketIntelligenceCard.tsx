"use client";

import {
  ArrowRight,
  ChevronLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Separator } from "../ui/separator";
import { useMIE } from "@/hooks/useMIE";
import type { MIEOpportunity, MIESignal, MIEHorizonSignal } from "@/types/mie";

const MIE_GRADIENT = `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0, 0, 0, 0.00) 81.25%), linear-gradient(114deg, #6366f1 34.62%, #4338ca 100%)`;

const BAR_HEIGHTS = [40, 65, 50, 85, 70, 45, 75, 55];

const VELOCITY_LABELS: Record<string, string> = {
  V1: "Urgent",
  V2: "Steady",
  V3: "Structural",
};

const VELOCITY_COLORS: Record<string, { bg: string; text: string }> = {
  V1: { bg: "#fef2f2", text: "#b91c1c" },
  V2: { bg: "#fffbeb", text: "#92400e" },
  V3: { bg: "#eff6ff", text: "#1d4ed8" },
};

const COST_COLORS: Record<string, { bg: string; text: string }> = {
  Low: { bg: "#f0fdf4", text: "#166534" },
  Medium: { bg: "#fffbeb", text: "#92400e" },
  High: { bg: "#fef2f2", text: "#b91c1c" },
};

export function MarketIntelligenceCard() {
  const {
    status,
    report,
    lastRun,
    canGenerate,
    hasProfile,
    errorMessage,
    loadingStep,
    loadingSteps,
    generate,
  } = useMIE();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null);

  const topOpportunity = report?.opportunities?.[0] ?? null;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className="relative rounded-[20px] overflow-hidden bg-white shadow-sm border border-gray-200 flex flex-col"
    >
      {/* Gradient Header */}
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
              {status === "loading" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={18} className="text-white" />
                </motion.div>
              ) : (
                <Activity size={18} className="text-white" />
              )}
            </div>
            <h3 className="text-white font-semibold text-[17px] tracking-tight leading-snug">
              Market Intelligence
            </h3>
          </div>

          <StatusPill status={status} lastRun={lastRun} />
        </div>

        {/* Idle — animated signal bars */}
        <AnimatePresence>
          {!isExpanded && status === "idle" && (
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

        {/* Loading — pulsing bars + step text */}
        <AnimatePresence>
          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5"
            >
              <div className="flex items-end gap-[3px] h-9 mb-4">
                {BAR_HEIGHTS.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [1, 1.4, 0.8, 1.2, 1], opacity: [0.22, 0.5, 0.22] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.1 * i,
                      ease: "easeInOut",
                    }}
                    className="flex-1 rounded-[2px] origin-bottom"
                    style={{ height: `${h}%`, backgroundColor: "rgba(255,255,255,0.22)" }}
                  />
                ))}
              </div>
              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-white/80 text-[13px] font-medium"
              >
                {loadingSteps[loadingStep]}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete — summary stats in header */}
        <AnimatePresence>
          {status === "complete" && report && !isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-5 mt-5"
            >
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-300" />
                <span className="text-white text-[13px] font-semibold">
                  {report.rising_signals.length} Rising
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-red-300" />
                <span className="text-white text-[13px] font-semibold">
                  {report.falling_signals.length} Falling
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-300" />
                <span className="text-white text-[13px] font-semibold">
                  {report.opportunities.length} Opportunities
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded header — description */}
        <AnimatePresence>
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/70 text-[13px] leading-relaxed mt-4"
            >
              Continuously monitors global market signals across 8 data categories, identifies who
              is being disrupted and how, and surfaces personalised business opportunities matched to
              your DNA profile.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Body — idle */}
      <AnimatePresence>
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            className="bg-white px-5 py-4 flex flex-col gap-4"
          >
            <p className="text-[13px] text-[#62646A] leading-relaxed">
              Continuously monitors global market signals across 8 data categories, identifies who
              is being disrupted and how, and surfaces personalised business opportunities matched to
              your DNA profile.
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
                onClick={generate}
                disabled={!canGenerate}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium border transition-all shadow-sm shrink-0",
                  canGenerate
                    ? "bg-[#4338ca] text-white border-[#4338ca] hover:bg-[#3730a3]"
                    : "bg-white text-[#9A9A9A] border-[#ECEDEE] cursor-not-allowed",
                )}
              >
                {!hasProfile ? "Complete DNA first" : "Generate Report"}
                {canGenerate && <ArrowRight size={14} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body — loading */}
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            className="bg-white px-5 py-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-[#4338ca]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={14} />
              </motion.div>
              <span className="text-[13px] font-medium">Generating your report…</span>
            </div>
            <div className="space-y-2">
              {loadingSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  animate={{ opacity: idx <= loadingStep ? 1 : 0.25 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      idx < loadingStep
                        ? "bg-[#4338ca]"
                        : idx === loadingStep
                          ? "bg-[#6366f1]"
                          : "bg-gray-200",
                    )}
                  />
                  <span className="text-[12px] text-[#62646A]">{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body — error */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            className="bg-white px-5 py-4 flex flex-col gap-3"
          >
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-[13px]">
                {errorMessage ?? "Something went wrong. Please try again."}
              </p>
            </div>
            <button
              onClick={generate}
              disabled={!canGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4338ca] text-white text-[13px] font-medium hover:bg-[#3730a3] transition-all shadow-sm w-fit"
            >
              Try Again
              <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body — complete collapsed */}
      <AnimatePresence>
        {status === "complete" && report && !isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            className="bg-white px-5 py-4 flex flex-col gap-4"
          >
            {topOpportunity && <TopOpportunityTeaser opportunity={topOpportunity} />}

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={generate}
                disabled={!canGenerate}
                className="flex items-center gap-1.5 text-[12px] text-[#62646A] hover:text-[#151515] transition-colors"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>

              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4338ca] text-white text-[13px] font-medium hover:bg-[#3730a3] transition-all shadow-sm shrink-0"
              >
                See My Report
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body — complete expanded full report */}
      <AnimatePresence initial={false}>
        {status === "complete" && report && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: "spring", stiffness: 300, damping: 35 },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden bg-white"
          >
            <div className="p-5 space-y-8">
              <ReportSection
                title="Rising Signals"
                icon={<TrendingUp size={15} className="text-emerald-500" />}
              >
                <div className="space-y-4">
                  {report.rising_signals.map((signal, idx) => (
                    <SignalRow key={idx} signal={signal} variant="rising" />
                  ))}
                </div>
              </ReportSection>

              <ReportSection
                title="Falling Signals"
                icon={<TrendingDown size={15} className="text-red-400" />}
              >
                <div className="space-y-4">
                  {report.falling_signals.map((signal, idx) => (
                    <SignalRow key={idx} signal={signal} variant="falling" />
                  ))}
                </div>
              </ReportSection>

              <ReportSection
                title="Your Opportunities"
                icon={<Sparkles size={15} className="text-[#6366f1]" />}
              >
                <div className="space-y-3">
                  {report.opportunities.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      isExpanded={expandedOpportunity === opp.id}
                      onToggle={() =>
                        setExpandedOpportunity(expandedOpportunity === opp.id ? null : opp.id)
                      }
                    />
                  ))}
                </div>
              </ReportSection>

              <ReportSection
                title="On the Horizon"
                icon={<Clock size={15} className="text-[#9A9A9A]" />}
              >
                <div className="space-y-4">
                  {report.horizon_signals.map((signal, idx) => (
                    <HorizonRow key={idx} signal={signal} />
                  ))}
                </div>
              </ReportSection>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {report.generated_at && (
                  <p className="text-[11px] text-[#9A9A9A]">
                    Generated{" "}
                    {new Date(report.generated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
                <button
                  onClick={generate}
                  disabled={!canGenerate}
                  className="flex items-center gap-1.5 text-[12px] text-[#62646A] hover:text-[#151515] transition-colors"
                >
                  <RefreshCw size={12} />
                  Regenerate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatusPill({ status, lastRun }: { status: string; lastRun: string | null }) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-1.5 bg-white/10 text-white/80 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 ml-3">
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-yellow-300"
        />
        Running
      </div>
    );
  }
  if (status === "complete") {
    return (
      <div className="flex items-center gap-1.5 bg-white/10 text-white/80 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 ml-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {lastRun ? "Updated" : "Active"}
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 bg-white/10 text-white/70 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 ml-3">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Error
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 bg-white/10 text-white/60 rounded-full px-3 py-1 text-[11px] font-medium shrink-0 ml-3">
      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
      Inactive
    </div>
  );
}

function TopOpportunityTeaser({ opportunity }: { opportunity: MIEOpportunity }) {
  const v = VELOCITY_COLORS[opportunity.velocity_tier] ?? VELOCITY_COLORS.V2;
  const c = COST_COLORS[opportunity.startup_cost] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <div className="rounded-xl border border-[#e0e7ff] bg-[#f5f3ff] p-3.5 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] text-[#6366f1] font-medium uppercase tracking-wide mb-1">
            Top Match
          </p>
          <p className="text-[14px] font-semibold text-[#151515] leading-snug">
            {opportunity.title}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="text-[22px] font-bold text-[#4338ca] leading-none">
            {opportunity.dna_fit_score}
          </span>
          <span className="text-[10px] text-[#6366f1] font-medium">DNA fit</span>
        </div>
      </div>
      <p className="text-[12px] text-[#62646A] leading-relaxed">{opportunity.one_line}</p>
      <div className="flex gap-2 flex-wrap">
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ backgroundColor: v.bg, color: v.text }}
        >
          {VELOCITY_LABELS[opportunity.velocity_tier]}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ backgroundColor: c.bg, color: c.text }}
        >
          {opportunity.startup_cost} cost · {opportunity.startup_cost_range}
        </span>
      </div>
    </div>
  );
}

function ReportSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-[13px] font-semibold text-[#151515]">{title}</h4>
      </div>
      <Separator className="bg-[#ECEDEE] mb-4" />
      {children}
    </section>
  );
}

function SignalRow({ signal, variant }: { signal: MIESignal; variant: "rising" | "falling" }) {
  const dotColor = variant === "rising" ? "#10b981" : "#ef4444";
  const v = VELOCITY_COLORS[signal.velocity] ?? VELOCITY_COLORS.V2;
  return (
    <div className="flex items-start gap-2">
      <div
        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[13px] font-medium text-[#151515]">{signal.title}</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: v.bg, color: v.text }}
          >
            {VELOCITY_LABELS[signal.velocity]}
          </span>
          <span className="text-[10px] text-[#9A9A9A]">{signal.category}</span>
        </div>
        <p className="text-[12px] text-[#62646A] leading-relaxed">{signal.description}</p>
        <p className="text-[12px] text-[#4338ca] leading-relaxed mt-1 font-medium">
          {signal.relevance_to_user}
        </p>
      </div>
    </div>
  );
}

function OpportunityCard({
  opportunity,
  isExpanded,
  onToggle,
}: {
  opportunity: MIEOpportunity;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const v = VELOCITY_COLORS[opportunity.velocity_tier] ?? VELOCITY_COLORS.V2;
  const c = COST_COLORS[opportunity.startup_cost] ?? { bg: "#f3f4f6", text: "#374151" };
  const score = opportunity.dna_fit_score;
  const scoreColor = score >= 80 ? "#16b364" : score >= 65 ? "#f59e0b" : "#6366f1";

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex flex-col items-center shrink-0 mt-0.5">
          <span className="text-[18px] font-bold leading-none" style={{ color: scoreColor }}>
            {score}
          </span>
          <span className="text-[9px] text-[#9A9A9A] font-medium leading-none mt-0.5">fit</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#151515] leading-snug">
            {opportunity.title}
          </p>
          <p className="text-[12px] text-[#62646A] mt-0.5 leading-relaxed">
            {opportunity.one_line}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: v.bg, color: v.text }}
            >
              {VELOCITY_LABELS[opportunity.velocity_tier]}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              {opportunity.startup_cost} · {opportunity.startup_cost_range}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-[#62646A]">
              <Zap size={9} className="inline mr-0.5" />
              {opportunity.time_to_revenue}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-[#9A9A9A] shrink-0 mt-1" />
        ) : (
          <ChevronDown size={16} className="text-[#9A9A9A] shrink-0 mt-1" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
              <p className="text-[12px] text-[#62646A] leading-relaxed">
                {opportunity.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem
                  label="Why it fits you"
                  value={opportunity.fit_explanation}
                  highlight
                />
                <DetailItem
                  label="First 10 customers"
                  value={opportunity.first_10_customers}
                />
                <DetailItem label="Window risk" value={opportunity.window_risk} />
                <DetailItem
                  label="Underlying signal"
                  value={opportunity.underlying_signal}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-lg p-3", highlight ? "bg-[#f5f3ff]" : "bg-gray-50")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9A9A9A] mb-1">
        {label}
      </p>
      <p
        className={cn(
          "text-[12px] leading-relaxed",
          highlight ? "text-[#4338ca]" : "text-[#62646A]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function HorizonRow({ signal }: { signal: MIEHorizonSignal }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#9A9A9A] shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-[#151515]">{signal.title}</span>
          <span className="text-[10px] text-[#9A9A9A] bg-gray-100 px-2 py-0.5 rounded-full">
            {signal.horizon}
          </span>
        </div>
        <p className="text-[12px] text-[#62646A] leading-relaxed">{signal.description}</p>
      </div>
    </div>
  );
}
