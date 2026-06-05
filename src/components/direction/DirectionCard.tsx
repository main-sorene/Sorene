"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  MoreHorizontal,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "../ui/separator";
import type { DirectionCardData } from "@/lib/directionTypes";

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
  cardData?: DirectionCardData;
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
  onChoose?: () => void;
  rawContent?: string;
  onLoadDetail?: () => void;
  onLoadSection3?: () => void;
  onLoadSection4?: () => void;
  isLoadingDetail?: boolean;
  isLoadingSection3?: boolean;
  isLoadingSection4?: boolean;
}

export function DirectionCard({
  title,
  description,
  variant = "standard",
  score,
  badges,
  actionText = "See Detail",
  className,
  cardData,
  whyFitsYou = [
    { title: "Mastery, not speed", description: "You're motivated by doing deep, quality work. This direction is built around diagnostic depth, not volume." },
    { title: "Solo, async by default", description: "You said extensive social interaction drains you. This defaults to async: intake forms in, reports out." },
    { title: "Low financial risk", description: "No upfront capital. No team. Start with one package and measure interest before committing." },
    { title: "Fits your time capacity", description: "1-2 audits per month is realistic with medium time availability." },
  ],
  keyRisks = [
    "Income is directly tied to hours without a clear path to scale",
    "Positioning may be too generic without a defined sub-domain",
    "Client availability expectations may conflict with your schedule",
  ],
  whyNowWorks = "The fractional executive model is rapidly normalizing — startups and SMBs increasingly prefer part-time senior hires over expensive full-time roles.",
  recommendedFirstStep = {
    progress: 40,
    steps: [
      { id: "1", label: 'Define the scope (e.g., "operational system audit for solo consultants")', completed: true },
      { id: "2", label: "Create a structured intake form with 10-15 questions", completed: false },
      { id: "3", label: "Write a sample audit report using a hypothetical case", completed: false },
      { id: "4", label: "Publish as a page or PDF. No paid promotion.", completed: false },
    ],
  },
  successMetric = "Organic requests within 30 days",
  isExpanded: isExpandedProp,
  onToggle,
  onHide,
  onChoose,
  rawContent,
  onLoadDetail,
  onLoadSection3,
  onLoadSection4,
  isLoadingDetail = false,
  isLoadingSection3 = false,
  isLoadingSection4 = false,
}: DirectionCardProps) {
  const router = useRouter();
  const goValidate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push("/execution-hub");
  };
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<string[]>(
    recommendedFirstStep.steps.filter((s) => s.completed).map((s) => s.id),
  );
  const [section3Open, setSection3Open] = useState(false);
  const [section4Open, setSection4Open] = useState(false);

  const isExpanded = isExpandedProp ?? internalIsExpanded;

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const expanding = !(isExpandedProp ?? internalIsExpanded);
    if (expanding && !cardData?.ikigai_filters) {
      onLoadDetail?.();
    }
    if (!expanding) {
      setSection3Open(false);
      setSection4Open(false);
    }
    onToggle ? onToggle() : setInternalIsExpanded(!internalIsExpanded);
  };

  const handleSection3Click = () => {
    if (!section3Open && !(cardData?.ocean_classification || cardData?.trend_connection)) {
      onLoadSection3?.();
    }
    setSection3Open(!section3Open);
  };

  const handleSection4Click = () => {
    if (!section4Open && !cardData?.startup_cost_usd) {
      onLoadSection4?.();
    }
    setSection4Open(!section4Open);
  };

  const getScoreColor = (s: string) => {
    const v = parseInt(s);
    if (v >= 70) return "#32C382";
    if (v >= 40) return "#F5B100";
    return "#DF2E16";
  };

  const getScoreGradient = (s?: string): string => {
    if (!s) return `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #A3E635 34.62%, #16B364 100%)`;
    const v = parseInt(s);
    const [c1, c2] = v >= 70 ? ["#A3E635", "#16B364"] : v >= 40 ? ["#FAC515", "#EF6820"] : ["#F38744", "#EF4444"];
    return `radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, ${c1} 34.62%, ${c2} 100%)`;
  };

  const getProgressColor = (p: number) => p >= 70 ? "#32C382" : p >= 40 ? "#FFC01F" : "#DF2E16";

  const filterScoreClass = (s: number) =>
    s >= 70 ? "text-[#32C382]" : s >= 40 ? "text-[#F5B100]" : "text-[#DF2E16]";

  const constraintColor = (status: string) =>
    status === "Pass" ? "#32C382" : status === "Warn" ? "#F5B100" : "#DF2E16";

  const oceanColor = (type: string) =>
    type === "Blue" ? "#3B82F6" : type === "Purple" ? "#8B5CF6" : "#EF4444";

  const toggleStep = (id: string) =>
    setCheckedSteps((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-[#151515] border-t-transparent rounded-full animate-spin" />
  );

  // Section-aware renderer for full Direction Engine output (recipe cards / rawContent path)
  const renderRaw = (text: string) => {
    interface RawSection { header: string; body: string[]; }
    const sections: RawSection[] = [];
    let cur: RawSection = { header: "__intro__", body: [] };
    for (const line of text.split("\n")) {
      const tr = line.trim();
      if (/^\*{2}[^*]+\*{2}$/.test(tr)) {
        sections.push(cur);
        cur = { header: tr.replace(/^\*{2}|\*{2}$/g, "").trim(), body: [] };
      } else {
        cur.body.push(line);
      }
    }
    sections.push(cur);

    const ib = (s: string) => s.split(/(\*\*.*?\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={j} className="font-semibold text-[#111111]">{p.slice(2, -2)}</strong>
        : <span key={j}>{p}</span>
    );
    const bodyText = (body: string[]) => body.filter(l => l.trim()).join(" ").trim();
    const buls = (body: string[], iconType: "check" | "x" | "warn" | "dot") =>
      body.filter(l => /^[-*•]/.test(l.trim())).map((l, j) => {
        const content = l.trim().replace(/^[-*•]\s*/, "");
        return (
          <div key={j} className="flex gap-3 items-start">
            {iconType === "check" && <CircleCheck size={18} className="shrink-0 mt-0.5 text-[#32C382]" />}
            {iconType === "x" && <CircleX size={18} className="shrink-0 mt-0.5 text-[#DC2626]" />}
            {iconType === "warn" && <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[#D97706]" />}
            {iconType === "dot" && <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />}
            <span className="text-[13px] text-[#62646A] leading-relaxed">{ib(content)}</span>
          </div>
        );
      });

    const nodes: React.ReactNode[] = [];
    let i = 0;
    while (i < sections.length) {
      const sec = sections[i];
      const h = sec.header.toLowerCase();
      const next = sections[i + 1];
      const nh = next?.header.toLowerCase() ?? "";

      if (sec.header === "__intro__" || /^direction[:\s]/i.test(sec.header)) { i++; continue; }

      // Why Fits + Key Risks — 2-column
      if ((h.includes("why it fit") || h.includes("why this fit")) && nh.includes("key risk")) {
        nodes.push(
          <div key={i} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h4 className="text-base font-medium text-[#151515] mb-4">Why This Fits You</h4>
              <Separator className="bg-[#ECEDEE] mb-5" />
              <div className="space-y-3">{buls(sec.body, "check")}</div>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-medium text-[#151515] mb-4">Key Risks</h4>
              <Separator className="bg-[#ECEDEE] mb-5" />
              <div className="space-y-3">{buls(next.body, "x")}</div>
            </div>
          </div>
        );
        i += 2; continue;
      }

      if (h.includes("why now")) {
        nodes.push(
          <div key={i}>
            <h4 className="text-base font-medium text-[#151515] mb-2">Why Now</h4>
            <p className="text-[13px] text-[#62646A] leading-relaxed">{bodyText(sec.body)}</p>
          </div>
        );
      } else if (h.includes("position")) {
        nodes.push(
          <p key={i} className="text-[13px] text-[#62646A] italic leading-relaxed border-l-2 border-[#ECEDEE] pl-3">
            {bodyText(sec.body)}
          </p>
        );
      } else if (h.includes("advantage")) {
        nodes.push(
          <div key={i}>
            <h5 className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider mb-1">Your Unfair Advantage</h5>
            <p className="text-[13px] text-[#151515] leading-relaxed">{bodyText(sec.body)}</p>
          </div>
        );
      } else if (h.includes("filter") || h.includes("ikigai")) {
        const filterLines = sec.body.filter(l => /^[-*]\s*(Alignment|Skills|Lifestyle|Financial|Market|What You|Ikigai)/i.test(l.trim()));
        nodes.push(
          <div key={i}>
            <h4 className="text-base font-medium text-[#151515] mb-4">Fit Filters</h4>
            <Separator className="bg-[#ECEDEE] mb-4" />
            <div className="space-y-3">
              {filterLines.map((l, j) => {
                const clean = l.trim().replace(/^[-*]\s*/, "");
                const m = clean.match(/^([^:]+):\s*(\d+)\s*[—\-–]\s*(.*)/);
                if (!m) return <p key={j} className="text-[13px] text-[#62646A]">{clean}</p>;
                const [, name, scoreStr, rationale] = m;
                const s = parseInt(scoreStr);
                const cls = s >= 70 ? "text-[#32C382]" : s >= 40 ? "text-[#F5B100]" : "text-[#DF2E16]";
                return (
                  <div key={j} className="flex items-start gap-3">
                    <span className={`font-semibold text-[13px] w-8 shrink-0 text-right ${cls}`}>{scoreStr}</span>
                    <div className="flex-1 text-[13px]">
                      <span className="font-medium text-[#151515]">{name.trim()}</span>
                      <p className="text-[12px] text-[#62646A] leading-relaxed mt-0.5">{rationale}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      } else if (h.includes("composite")) {
        const s = parseInt(bodyText(sec.body)) || 0;
        const cls = s >= 70 ? "text-[#32C382]" : s >= 40 ? "text-[#F5B100]" : "text-[#DF2E16]";
        nodes.push(
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] text-[#9A9A9A]">Composite</span>
            <span className={`text-[18px] font-semibold ${cls}`}>{s}</span>
          </div>
        );
      } else if (h.includes("high-risk") || (h.includes("risk") && h.includes("flag"))) {
        const flags = sec.body.filter(l => /^[-*•]/.test(l.trim()));
        const hasNone = flags.length === 0 || flags.some(f => /none/i.test(f));
        if (!hasNone) {
          nodes.push(
            <div key={i} className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FECACA] space-y-1">
              {buls(sec.body, "warn")}
            </div>
          );
        }
      } else if (h.includes("metric")) {
        const ms = sec.body.filter(l => /^[-*•]/.test(l.trim())).map(l => {
          const clean = l.trim().replace(/^[-*•]\s*/, "");
          const idx2 = clean.indexOf(":");
          return idx2 > -1 ? { k: clean.slice(0, idx2).trim(), v: clean.slice(idx2 + 1).trim() } : { k: clean, v: "" };
        });
        nodes.push(
          <div key={i} className="grid grid-cols-3 gap-3">
            {ms.map((m, j) => {
              const icons = [<DollarSign key="d" size={14} />, <Clock key="c" size={14} />, <Zap key="z" size={14} />];
              return (
                <div key={j} className="p-3 rounded-xl bg-[#F5F5F7] space-y-1">
                  <div className="flex items-center gap-1 text-[#9A9A9A]">
                    {icons[j] ?? null}
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{m.k}</span>
                  </div>
                  <p className="text-[13px] font-medium text-[#151515]">{m.v}</p>
                </div>
              );
            })}
          </div>
        );
      } else if (h.includes("constraint")) {
        const txt = bodyText(sec.body);
        const status = /^pass/i.test(txt) ? "Pass" : /^warn/i.test(txt) ? "Warn" : "Fail";
        const reason = txt.replace(/^(pass|warn|fail)\s*[—\-–]?\s*/i, "");
        const col = constraintColor(status);
        nodes.push(
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border"
            style={{ borderColor: col, backgroundColor: `${col}15` }}>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-md text-white shrink-0" style={{ backgroundColor: col }}>{status}</span>
            {reason && <p className="text-[12px] text-[#62646A] leading-relaxed">{reason}</p>}
          </div>
        );
      } else if (h.includes("first 10") || (h.includes("customer") && !h.includes("complaint"))) {
        nodes.push(
          <div key={i}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users size={13} className="text-[#9A9A9A]" />
              <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">First 10 Customers</span>
            </div>
            <p className="text-[13px] text-[#62646A] leading-relaxed">{bodyText(sec.body)}</p>
          </div>
        );
      } else if (h.includes("competition") || h.includes("competitor")) {
        const layers = sec.body.filter(l => l.trim());
        nodes.push(
          <div key={i}>
            <h4 className="text-base font-medium text-[#151515] mb-3">Market Reality</h4>
            <Separator className="bg-[#ECEDEE] mb-3" />
            <div className="space-y-2">
              {layers.map((l, j) => (
                <div key={j}>
                  <p className="text-[13px] text-[#62646A] leading-relaxed">{ib(l.trim())}</p>
                </div>
              ))}
            </div>
          </div>
        );
      } else if (h.includes("economic") || h.includes("urgency")) {
        nodes.push(
          <div key={i} className="flex-1 p-3 rounded-xl bg-[#F5F5F7] space-y-1">
            <div className="flex items-center gap-1.5">
              <DollarSign size={13} className="text-[#151515]" />
              <span className="text-[11px] font-semibold text-[#62646A] uppercase tracking-wide">Economic Urgency</span>
            </div>
            <p className="text-[12px] text-[#151515] leading-relaxed">{bodyText(sec.body)}</p>
          </div>
        );
      } else if (h.includes("ocean")) {
        const txt = bodyText(sec.body);
        const type = /blue/i.test(txt) ? "Blue" : /purple/i.test(txt) ? "Purple" : "Red";
        const density = txt.replace(/^(blue|purple|red)\s*[—\-–]?\s*/i, "");
        nodes.push(
          <div key={i} className="p-3 rounded-xl border-2 flex flex-col items-start gap-1"
            style={{ borderColor: oceanColor(type) }}>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: oceanColor(type) }}>{type} Ocean</span>
            <span className="text-[12px] text-[#9A9A9A]">{density}</span>
          </div>
        );
      } else if (h.includes("window")) {
        nodes.push(
          <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
            <Clock size={13} className="text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-[#D97706] uppercase tracking-wide">Window Risk</span>
              <p className="text-[12px] text-[#92400E] mt-0.5 leading-relaxed">{bodyText(sec.body)}</p>
            </div>
          </div>
        );
      } else if (h.includes("trend") || h.includes("complaint")) {
        const label = h.includes("trend") ? "Trend" : "Complaint Source";
        nodes.push(
          <div key={i}>
            <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">{label}</span>
            <p className="text-[13px] text-[#62646A] mt-0.5">{bodyText(sec.body)}</p>
          </div>
        );
      } else if (h.includes("path") && !h.includes("distribution")) {
        const txt = bodyText(sec.body);
        const label = /safe/i.test(txt) ? "Safe" : /stretch/i.test(txt) ? "Stretch" : /aligned/i.test(txt) ? "Aligned" : txt.split("—")[0].trim();
        nodes.push(
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[#62646A]">{label}</span>
            <p className="text-[12px] text-[#9A9A9A]">{txt.split("—").slice(1).join("—").trim()}</p>
          </div>
        );
      } else if (h.includes("market signal") || h.includes("signal confidence")) {
        const txt = bodyText(sec.body);
        const isValidated = /complaint-validated/i.test(txt);
        const isInsufficient = /insufficient/i.test(txt);
        nodes.push(
          <div key={i}>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              isValidated ? "bg-[#CEF2E2] text-[#196141]" : isInsufficient ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FEF3C7] text-[#92400E]"
            )}>{isValidated ? "Complaint-validated" : isInsufficient ? "Insufficient signal" : "Inferred"}</span>
            <p className="text-[12px] text-[#9A9A9A] mt-1">{txt.split("—").slice(1).join("—").trim()}</p>
          </div>
        );
      } else if (h.includes("distribution path")) {
        nodes.push(
          <div key={i}>
            <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Distribution Path</span>
            <p className="text-[13px] text-[#62646A] mt-0.5 leading-relaxed">{bodyText(sec.body)}</p>
          </div>
        );
      } else if (h.includes("work fit")) {
        const txt = bodyText(sec.body);
        const isWarn = /flag|repeat|risk|disliked/i.test(txt);
        nodes.push(
          <div key={i} className={cn(
            "flex items-start gap-2 p-3 rounded-xl border",
            isWarn ? "bg-[#FFFBEB] border-[#FDE68A]" : "bg-[#F0FDF4] border-[#BBF7D0]"
          )}>
            <div>
              <span className={cn("text-[11px] font-semibold uppercase tracking-wide", isWarn ? "text-[#D97706]" : "text-[#16A34A]")}>Work Fit Check</span>
              <p className="text-[12px] text-[#62646A] mt-0.5 leading-relaxed">{txt}</p>
            </div>
          </div>
        );
      } else if (sec.body.some(l => l.trim())) {
        nodes.push(
          <div key={i} className="space-y-2">
            {sec.body.filter(l => l.trim()).map((l, j) => {
              const tr = l.trim();
              return /^[-*•]/.test(tr)
                ? <div key={j} className="flex gap-2 items-start"><span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" /><span className="text-[13px] text-[#62646A]">{ib(tr.replace(/^[-*•]\s*/, ""))}</span></div>
                : <p key={j} className="text-[13px] text-[#62646A] leading-relaxed">{ib(tr)}</p>;
            })}
          </div>
        );
      }
      i++;
    }

    return <div className="space-y-6">{nodes}</div>;
  };

  // ── Legacy expanded content ─────────────────────────────────────────────────
  const legacyContent = (
    <div className="p-3 md:p-4 space-y-8">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
        <div>
          <h4 className="text-base font-medium text-[#151515] mb-3">Why This Fits You</h4>
          <Separator className="bg-[#ECEDEE] mb-4" />
          <div className="space-y-4">
            {whyFitsYou.map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.05 }} className="flex gap-4 items-center">
                <CircleCheck size={20} className="text-[#32C382] shrink-0" />
                <div>
                  <h5 className="text-[14px] font-medium text-[#151515] mb-0.5">{item.title}</h5>
                  <p className="text-[13px] text-[#62646A] leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-base font-medium text-[#151515] mb-3">Key Risks</h4>
          <Separator className="bg-[#ECEDEE] mb-4" />
          <div className="space-y-2">
            {keyRisks.map((risk, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.05 }} className="flex gap-3 items-start">
                <CircleX size={18} className="text-[#DF2E16] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#62646A] leading-relaxed">{risk}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-base font-medium text-[#151515] mb-3">Why Now Works</h4>
          <Separator className="bg-[#ECEDEE] mb-4" />
          <p className="text-[13px] text-[#62646A] leading-relaxed">{whyNowWorks}</p>
        </div>
      </motion.section>
    </div>
  );

  const rawContent_rendered = rawContent ? (
    <div className="p-3 md:p-4">{renderRaw(rawContent)}</div>
  ) : null;

  // ── Hero variant ─────────────────────────────────────────────────────────────
  if (variant === "hero") {
    return (
      <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("relative rounded-4xl overflow-hidden bg-white shadow-sm border border-gray-100 flex flex-col", className)}>

        {/* Gradient header — always visible */}
        <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
          className="p-6 flex flex-col" style={{ background: getScoreGradient(score) }}>
          <AnimatePresence>
            {isExpanded && (
              <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                onClick={(e) => handleToggle(e)}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium mb-8 w-fit">
                <ChevronLeft size={20} />Back to summary
              </motion.button>
            )}
          </AnimatePresence>
          <div className="flex justify-between items-start">
            <h3 className="text-heading-xsmall font-medium text-white leading-[1.2] max-w-[80%] tracking-tight">
              {title}
            </h3>
            {score && (
              <div className="text-right">
                <div className="text-[32px] font-medium text-white leading-none">{score}%</div>
                <div className="text-[11px] text-white/70 font-medium mt-1">Compatibility</div>
              </div>
            )}
          </div>
          {cardData && (
            <div className="flex items-center gap-2 mt-3">
              <p className="text-[13px] text-white/80">{cardData.oneliner}</p>
              {cardData.path_label && (
                <span className="ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {cardData.path_label}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Action bar */}
        <div className="bg-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {onHide && (
                <button onClick={(e) => { e.stopPropagation(); onHide(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#ECEDEE] text-[#62646A] text-[13px] font-medium hover:text-[#DF2E16] hover:border-[#DF2E16] transition-all">
                  Hide
                </button>
              )}
              {cardData && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white"
                  style={{ backgroundColor: constraintColor(cardData.constraint_check.status) }}>
                  {cardData.constraint_check.status}
                </div>
              )}
            </div>
            <AnimatePresence mode="wait">
              {!isExpanded && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2">
                  <button onClick={goValidate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-[14px] font-medium hover:bg-[#2a2a2a] transition-all">
                    Start Validate
                  </button>
                  <button onClick={(e) => handleToggle(e)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#151515] text-[14px] font-medium border border-[#ECEDEE] hover:bg-gray-50 transition-all shadow-sm">
                    {actionText}<ArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
              className="overflow-hidden bg-white">
              {rawContent_rendered ? (
                <div className="p-3 md:p-4">{renderRaw(rawContent!)}</div>
              ) : cardData ? (
                <div className="divide-y divide-[#ECEDEE]">

                  {/* Section 1: Why This Fits You */}
                  <div className="p-4 pb-6 space-y-4">
                    {isLoadingDetail && !cardData?.ikigai_filters ? (
                      <div className="flex items-center gap-2 py-8 justify-center">
                        <Spinner />
                        <span className="text-[13px] text-[#9CA3AF]">Analysing your fit…</span>
                      </div>
                    ) : (cardData.ikigai_filters || cardData.four_filters) ? (
                      <>
                        <div className="flex justify-between items-center">
                          <h4 className="text-base font-medium text-[#151515]">Why This Fits You</h4>
                          {cardData.composite_score != null && (
                            <span className={cn("text-[18px] font-semibold", filterScoreClass(cardData.composite_score))}>
                              {cardData.composite_score}
                            </span>
                          )}
                        </div>
                        <Separator className="bg-[#ECEDEE]" />
                        <div className="space-y-3">
                          {(cardData.ikigai_filters
                            ? [
                                ["What You Love", cardData.ikigai_filters.what_you_love],
                                ["What You're Good At", cardData.ikigai_filters.what_you_are_good_at],
                                ["What The World Needs", cardData.ikigai_filters.what_world_needs],
                                ["What You Can Be Paid For", cardData.ikigai_filters.what_you_can_be_paid_for],
                                ["Lifestyle Fit", cardData.ikigai_filters.lifestyle_fit],
                              ]
                            : [
                                ["What You Love", cardData.four_filters?.alignment],
                                ["What You're Good At", cardData.four_filters?.skills_match],
                                ["What The World Needs", cardData.four_filters?.market_potential],
                                ["What You Can Be Paid For", cardData.four_filters?.financial_viability],
                                ["Lifestyle Fit", cardData.four_filters?.lifestyle_fit],
                              ]
                          ).filter((entry): entry is [string, { score: number; reason: string }] => !!entry[1])
                          .map(([label, item], idx) => (
                            <div key={label} className="flex gap-3">
                              <span className={cn("w-8 shrink-0 text-right text-[13px] font-semibold tabular-nums", filterScoreClass(item.score))}>{item.score}</span>
                              <div>
                                <span className="text-[13px] font-medium text-[#151515]">{label}</span>
                                <p className="text-[12px] text-[#62646A] leading-relaxed mt-0.5">{item.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {(cardData.high_risk_flags?.length ?? 0) > 0 && (
                          <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FECACA] space-y-1">
                            {cardData.high_risk_flags!.map((flag, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <AlertTriangle size={13} className="text-[#DF2E16] shrink-0 mt-0.5" />
                                <p className="text-[12px] text-[#DF2E16]">{flag}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {cardData.unfair_advantage && (
                          <div>
                            <h5 className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider mb-1.5">Your Unfair Advantage</h5>
                            <p className="text-[13px] text-[#151515] leading-relaxed">{cardData.unfair_advantage}</p>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>

                  {/* Section 3: Market Reality accordion */}
                  <div>
                    <button
                      onClick={handleSection3Click}
                      className="w-full flex justify-between items-center p-4 text-left hover:bg-[#FAFAFA] transition-colors"
                    >
                      <span className="text-[15px] font-medium text-[#151515]">Market Reality</span>
                      {isLoadingSection3 ? (
                        <Spinner />
                      ) : section3Open ? (
                        <ChevronUp size={16} className="text-[#9CA3AF]" />
                      ) : (
                        <ChevronDown size={16} className="text-[#9CA3AF]" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {section3Open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 space-y-5">
                            {isLoadingSection3 && !(cardData.ocean_classification || cardData.trend_connection) ? (
                              <div className="flex items-center gap-2 py-8 justify-center">
                                <Spinner />
                                <span className="text-[13px] text-[#9CA3AF]">Analysing market reality…</span>
                              </div>
                            ) : (
                              <>
                                {cardData.trend_connection && (
                                  <div>
                                    <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Trend</span>
                                    <p className="text-[13px] text-[#62646A] mt-1 leading-relaxed">{cardData.trend_connection}</p>
                                  </div>
                                )}
                                {cardData.ocean_classification && (
                                  <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 min-w-[90px]"
                                      style={{ borderColor: oceanColor(cardData.ocean_classification.type) }}>
                                      <span className="text-[11px] font-semibold uppercase tracking-wide"
                                        style={{ color: oceanColor(cardData.ocean_classification.type) }}>
                                        {cardData.ocean_classification.type} Ocean
                                      </span>
                                    </div>
                                    <p className="text-[12px] text-[#62646A] leading-relaxed">{cardData.ocean_classification.density}</p>
                                  </div>
                                )}
                                {(cardData.key_competitors && cardData.key_competitors.length > 0) && (
                                  <div>
                                    <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Key Competitors</span>
                                    <div className="mt-2 space-y-2">
                                      {cardData.key_competitors.map((c, i) => (
                                        <div key={i} className="flex gap-2 items-start">
                                          <span className="text-[13px] font-medium text-[#151515] shrink-0 min-w-[120px]">{c.name}</span>
                                          <span className="text-[12px] text-[#62646A] leading-relaxed">— {c.what_they_do}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {cardData.economic_urgency && (
                                  <div className="p-3 rounded-xl bg-[#F5F5F7] space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <DollarSign size={13} className="text-[#151515]" />
                                      <span className="text-[11px] font-semibold text-[#62646A] uppercase tracking-wide">Economic Urgency</span>
                                    </div>
                                    <p className="text-[12px] text-[#151515] leading-relaxed">{cardData.economic_urgency}</p>
                                  </div>
                                )}
                                {(cardData.key_risks?.length ?? 0) > 0 && (
                                  <div>
                                    <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Key Risks</span>
                                    <div className="mt-2 space-y-2">
                                      {cardData.key_risks!.map((risk, idx) => (
                                        <div key={idx} className="flex gap-3 items-start">
                                          <CircleX size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
                                          <p className="text-[13px] text-[#62646A] leading-relaxed">{risk}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section 4: Operations accordion */}
                  <div>
                    <button
                      onClick={handleSection4Click}
                      className="w-full flex justify-between items-center p-4 text-left hover:bg-[#FAFAFA] transition-colors"
                    >
                      <span className="text-[15px] font-medium text-[#151515]">Operations</span>
                      {isLoadingSection4 ? (
                        <Spinner />
                      ) : section4Open ? (
                        <ChevronUp size={16} className="text-[#9CA3AF]" />
                      ) : (
                        <ChevronDown size={16} className="text-[#9CA3AF]" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {section4Open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 space-y-5">
                            {isLoadingSection4 && !cardData.startup_cost_usd ? (
                              <div className="flex items-center gap-2 py-8 justify-center">
                                <Spinner />
                                <span className="text-[13px] text-[#9CA3AF]">Calculating operations…</span>
                              </div>
                            ) : (
                              <>
                                {(cardData.startup_cost_usd || cardData.time_to_first_revenue_weeks || cardData.hours_per_week) && (
                                  <div className="grid grid-cols-3 gap-3">
                                    {[
                                      { icon: <DollarSign size={14} />, label: "Startup Cost", value: cardData.startup_cost_usd },
                                      { icon: <Clock size={14} />, label: "First Revenue", value: cardData.time_to_first_revenue_weeks },
                                      { icon: <Zap size={14} />, label: "Hrs/Week", value: cardData.hours_per_week },
                                    ].map(({ icon, label, value }, i) => (
                                      <div key={i} className="p-3 rounded-xl bg-[#F5F5F7] space-y-1">
                                        <div className="flex items-center gap-1 text-[#9A9A9A]">
                                          {icon}
                                          <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                                        </div>
                                        <p className="text-[13px] font-medium text-[#151515]">{value || "—"}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {cardData.constraint_check && (
                                  <div>
                                    <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Constraint Check</span>
                                    <div className="flex items-start gap-3 p-3 rounded-xl border mt-1.5"
                                      style={{ borderColor: constraintColor(cardData.constraint_check.status), backgroundColor: `${constraintColor(cardData.constraint_check.status)}15` }}>
                                      <span className="text-[12px] font-bold px-2 py-0.5 rounded-md text-white shrink-0"
                                        style={{ backgroundColor: constraintColor(cardData.constraint_check.status) }}>
                                        {cardData.constraint_check.status}
                                      </span>
                                      {cardData.constraint_check.reason && (
                                        <p className="text-[12px] text-[#62646A] leading-relaxed">{cardData.constraint_check.reason}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {cardData.first_10_customers && (
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <Users size={13} className="text-[#9A9A9A]" />
                                      <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">First 10 Customers</span>
                                    </div>
                                    <p className="text-[13px] text-[#62646A] leading-relaxed">{cardData.first_10_customers}</p>
                                  </div>
                                )}
                                {cardData.distribution_path && (
                                  <div>
                                    <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Distribution Path</span>
                                    <p className="text-[13px] text-[#62646A] mt-0.5 leading-relaxed">{cardData.distribution_path}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Start Validation CTA */}
                  <div className="p-4">
                    <button onClick={goValidate}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white text-[14px] font-medium hover:bg-[#2a2a2a] transition-all">
                      Start Validation
                    </button>
                  </div>

                </div>
              ) : (
                legacyContent
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Standard variant ─────────────────────────────────────────────────────────
  const expandedDetailContent = rawContent_rendered ?? (cardData ? (
    <div className="divide-y divide-[#ECEDEE]">

      {/* Section 1: Why This Fits You */}
      <div className="p-4 pb-6 space-y-4">
        {isLoadingDetail && !cardData?.ikigai_filters ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Spinner />
            <span className="text-[13px] text-[#9CA3AF]">Analysing your fit…</span>
          </div>
        ) : (cardData.ikigai_filters || cardData.four_filters) ? (
          <>
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium text-[#151515]">Why This Fits You</h4>
              {cardData.composite_score != null && (
                <span className={cn("text-[18px] font-semibold", filterScoreClass(cardData.composite_score))}>
                  {cardData.composite_score}
                </span>
              )}
            </div>
            <Separator className="bg-[#ECEDEE]" />
            <div className="space-y-3">
              {(cardData.ikigai_filters
                ? [
                    ["What You Love", cardData.ikigai_filters.what_you_love],
                    ["What You're Good At", cardData.ikigai_filters.what_you_are_good_at],
                    ["What The World Needs", cardData.ikigai_filters.what_world_needs],
                    ["What You Can Be Paid For", cardData.ikigai_filters.what_you_can_be_paid_for],
                    ["Lifestyle Fit", cardData.ikigai_filters.lifestyle_fit],
                  ]
                : [
                    ["What You Love", cardData.four_filters?.alignment],
                    ["What You're Good At", cardData.four_filters?.skills_match],
                    ["What The World Needs", cardData.four_filters?.market_potential],
                    ["What You Can Be Paid For", cardData.four_filters?.financial_viability],
                    ["Lifestyle Fit", cardData.four_filters?.lifestyle_fit],
                  ]
              ).filter((entry): entry is [string, { score: number; reason: string }] => !!entry[1])
              .map(([label, item]) => (
                <div key={label} className="flex gap-3">
                  <span className={cn("w-8 shrink-0 text-right text-[13px] font-semibold tabular-nums", filterScoreClass(item.score))}>{item.score}</span>
                  <div>
                    <span className="text-[13px] font-medium text-[#151515]">{label}</span>
                    <p className="text-[12px] text-[#62646A] leading-relaxed mt-0.5">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
            {(cardData.high_risk_flags?.length ?? 0) > 0 && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FECACA] space-y-1">
                {cardData.high_risk_flags!.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-[#DF2E16] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#DF2E16]">{flag}</p>
                  </div>
                ))}
              </div>
            )}
            {cardData.unfair_advantage && (
              <div>
                <h5 className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider mb-1.5">Your Unfair Advantage</h5>
                <p className="text-[13px] text-[#151515] leading-relaxed">{cardData.unfair_advantage}</p>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Section 2: Market Reality accordion */}
      <div>
        <button
          onClick={handleSection3Click}
          className="w-full flex justify-between items-center p-4 text-left hover:bg-[#FAFAFA] transition-colors"
        >
          <span className="text-[15px] font-medium text-[#151515]">Market Reality</span>
          {isLoadingSection3 ? (
            <Spinner />
          ) : section3Open ? (
            <ChevronUp size={16} className="text-[#9CA3AF]" />
          ) : (
            <ChevronDown size={16} className="text-[#9CA3AF]" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {section3Open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-5">
                {isLoadingSection3 && !(cardData.ocean_classification || cardData.trend_connection) ? (
                  <div className="flex items-center gap-2 py-8 justify-center">
                    <Spinner />
                    <span className="text-[13px] text-[#9CA3AF]">Analysing market reality…</span>
                  </div>
                ) : (
                  <>
                    {cardData.trend_connection && (
                      <div>
                        <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Trend</span>
                        <p className="text-[13px] text-[#62646A] mt-1 leading-relaxed">{cardData.trend_connection}</p>
                      </div>
                    )}
                    {cardData.ocean_classification && (
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 min-w-[90px]"
                          style={{ borderColor: oceanColor(cardData.ocean_classification.type) }}>
                          <span className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: oceanColor(cardData.ocean_classification.type) }}>
                            {cardData.ocean_classification.type} Ocean
                          </span>
                        </div>
                        <p className="text-[12px] text-[#62646A] leading-relaxed">{cardData.ocean_classification.density}</p>
                      </div>
                    )}
                    {(cardData.key_competitors && cardData.key_competitors.length > 0) && (
                      <div>
                        <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Key Competitors</span>
                        <div className="mt-2 space-y-2">
                          {cardData.key_competitors.map((c, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <span className="text-[13px] font-medium text-[#151515] shrink-0 min-w-[120px]">{c.name}</span>
                              <span className="text-[12px] text-[#62646A] leading-relaxed">— {c.what_they_do}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {cardData.economic_urgency && (
                      <div className="p-3 rounded-xl bg-[#F5F5F7] space-y-1">
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={13} className="text-[#151515]" />
                          <span className="text-[11px] font-semibold text-[#62646A] uppercase tracking-wide">Economic Urgency</span>
                        </div>
                        <p className="text-[12px] text-[#151515] leading-relaxed">{cardData.economic_urgency}</p>
                      </div>
                    )}
                    {(cardData.key_risks?.length ?? 0) > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Key Risks</span>
                        <div className="mt-2 space-y-2">
                          {cardData.key_risks!.map((risk, idx) => (
                            <div key={idx} className="flex gap-3 items-start">
                              <CircleX size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
                              <p className="text-[13px] text-[#62646A] leading-relaxed">{risk}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section 3: Operations accordion */}
      <div>
        <button
          onClick={handleSection4Click}
          className="w-full flex justify-between items-center p-4 text-left hover:bg-[#FAFAFA] transition-colors"
        >
          <span className="text-[15px] font-medium text-[#151515]">Operations</span>
          {isLoadingSection4 ? (
            <Spinner />
          ) : section4Open ? (
            <ChevronUp size={16} className="text-[#9CA3AF]" />
          ) : (
            <ChevronDown size={16} className="text-[#9CA3AF]" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {section4Open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-5">
                {isLoadingSection4 && !cardData.startup_cost_usd ? (
                  <div className="flex items-center gap-2 py-8 justify-center">
                    <Spinner />
                    <span className="text-[13px] text-[#9CA3AF]">Calculating operations…</span>
                  </div>
                ) : (
                  <>
                    {(cardData.startup_cost_usd || cardData.time_to_first_revenue_weeks || cardData.hours_per_week) && (
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { icon: <DollarSign size={14} />, label: "Startup Cost", value: cardData.startup_cost_usd },
                          { icon: <Clock size={14} />, label: "First Revenue", value: cardData.time_to_first_revenue_weeks },
                          { icon: <Zap size={14} />, label: "Hrs/Week", value: cardData.hours_per_week },
                        ].map(({ icon, label, value }, i) => (
                          <div key={i} className="p-3 rounded-xl bg-[#F5F5F7] space-y-1">
                            <div className="flex items-center gap-1 text-[#9A9A9A]">
                              {icon}
                              <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                            </div>
                            <p className="text-[13px] font-medium text-[#151515]">{value || "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {cardData.constraint_check && (
                      <div>
                        <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Constraint Check</span>
                        <div className="flex items-start gap-3 p-3 rounded-xl border mt-1.5"
                          style={{ borderColor: constraintColor(cardData.constraint_check.status), backgroundColor: `${constraintColor(cardData.constraint_check.status)}15` }}>
                          <span className="text-[12px] font-bold px-2 py-0.5 rounded-md text-white shrink-0"
                            style={{ backgroundColor: constraintColor(cardData.constraint_check.status) }}>
                            {cardData.constraint_check.status}
                          </span>
                          {cardData.constraint_check.reason && (
                            <p className="text-[12px] text-[#62646A] leading-relaxed">{cardData.constraint_check.reason}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {cardData.first_10_customers && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Users size={13} className="text-[#9A9A9A]" />
                          <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">First 10 Customers</span>
                        </div>
                        <p className="text-[13px] text-[#62646A] leading-relaxed">{cardData.first_10_customers}</p>
                      </div>
                    )}
                    {cardData.distribution_path && (
                      <div>
                        <span className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">Distribution Path</span>
                        <p className="text-[13px] text-[#62646A] mt-0.5 leading-relaxed">{cardData.distribution_path}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Start Validation CTA */}
      <div className="p-4">
        <button onClick={goValidate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white text-[14px] font-medium hover:bg-[#2a2a2a] transition-all">
          Start Validation
        </button>
      </div>

    </div>
  ) : legacyContent);

  return (
    <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      className={cn("relative rounded-[20px] overflow-hidden bg-white shadow-sm border border-gray-200 flex flex-col", !isExpanded && "min-h-35 cursor-pointer", className)}>
      <motion.div layout transition={{ layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
        className={cn("flex flex-col", isExpanded ? "p-6 pb-8" : "p-3")}
        style={{ background: isExpanded ? getScoreGradient(score) : "transparent" }}
        onClick={!isExpanded ? (e) => handleToggle(e) : undefined}>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center justify-between mb-8">
              <button onClick={(e) => handleToggle(e)} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium w-fit">
                <ChevronLeft size={20} />Back to summary
              </button>
              <button onClick={(e) => e.stopPropagation()} className="text-white"><MoreHorizontal size={20} /></button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-between items-start">
          <h3 className={cn("font-medium leading-snug tracking-tight", isExpanded ? "text-heading-xsmall text-white max-w-[80%]" : "text-body-large-medium text-[#151515] pr-6 mb-4")}>
            {title}
          </h3>
          {score && (
            <div className="flex flex-col text-right">
              <div className={isExpanded ? "text-[32px] font-medium text-white leading-none" : "text-body-large-medium"} style={{ color: isExpanded ? undefined : getScoreColor(score) }}>
                {score}%
              </div>
              <div className={isExpanded ? "text-[11px] text-white/70 font-medium mt-1" : "text-[10px] text-[#62646A] font-medium"}>Compatibility</div>
            </div>
          )}
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white/80 text-sm leading-relaxed mt-4">
              {description}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {!isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout="position"
            className="px-5 pb-5 flex flex-col flex-1" onClick={(e) => handleToggle(e)}>
            {cardData && (
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] text-[#9A9A9A] font-medium">{cardData.oneliner}</p>
              </div>
            )}
            <p className="text-label-medium text-[#62646A] leading-relaxed mb-4 line-clamp-2">{description}</p>
            <div className="mt-auto flex items-center justify-between gap-2">
              {/* Left: Hide + constraint badge (no label text — space is tight in grid) */}
              <div className="flex items-center gap-2">
                {onHide && (
                  <button onClick={(e) => { e.stopPropagation(); onHide(); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#ECEDEE] text-[#62646A] text-[13px] font-medium hover:text-[#DF2E16] hover:border-[#DF2E16] transition-all">
                    Hide
                  </button>
                )}
                {cardData && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white"
                    style={{ backgroundColor: constraintColor(cardData.constraint_check.status) }}>
                    {cardData.constraint_check.status}
                  </div>
                )}
              </div>
              {/* Right: Start Validate + View detail */}
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); goValidate(e); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#2a2a2a] transition-all">
                  Start Validate
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleToggle(e); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#151515] text-[13px] font-medium border border-[#ECEDEE] hover:bg-gray-50 transition-all shadow-sm">
                  {actionText}<ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.2 } }}
            className="overflow-hidden bg-white">
            {expandedDetailContent}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
