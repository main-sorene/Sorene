"use client";

import { useState, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { resourcesConstraintsAtom, EMPTY_RESOURCES, ResourcesConstraints, recipeDirectionsAtom, RecipeDirection } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { Loader2, ChevronLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDirectionResult } from "@/hooks/useDirectionResult";

function parseDirectionCard(text: string): RecipeDirection | null {
  const titleMatch = text.match(/\*{0,2}Direction:\s*([^\n*]+?)\*{0,2}\n/i);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim().replace(/^["'"']+|["'"']+$/g, "").trim();
  const afterTitle = text.slice(text.indexOf(titleMatch[0]) + titleMatch[0].length).trim();
  const descEnd = afterTitle.search(/\*{0,2}Why it fits you\*{0,2}/i);
  const description = (descEnd > 0 ? afterTitle.slice(0, descEnd) : afterTitle.slice(0, 300)).trim();
  const whySection = afterTitle.match(/\*{0,2}Why it fits you\*{0,2}[:\n]+([\s\S]*?)(?=\*{0,2}Key risks\*{0,2}|$)/i);
  const risksSection = afterTitle.match(/\*{0,2}Key risks\*{0,2}[:\n]+([\s\S]*?)(?=\*{0,2}|$)/i);
  const parseList = (s: string | undefined) =>
    (s ?? "").split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
  const scoreMatch = text.match(/\*{0,2}Composite Score\*{0,2}[:\s]*\n?\s*(\d+)/i);
  const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 90;
  return {
    id: `rc-${Date.now()}`,
    title,
    description,
    whyFitsYou: parseList(whySection?.[1]),
    keyRisks: parseList(risksSection?.[1]),
    firstStep: "",
    score,
    rawContent: text,
  };
}

const inputCls = "w-full px-3 py-2.5 text-[13px] text-[#151515] bg-white border border-[#ECEDEE] rounded-xl outline-none focus:border-[#D1D5DB] transition-colors placeholder:text-[#9CA3AF]";
const selectCls = inputCls + " appearance-none cursor-pointer";

const SELECT_OPTS = {
  location: ["Fully remote", "Local only", "Can travel occasionally", "Very flexible"],
  online: ["Fully online", "Prefer online", "Mix of both", "Prefer offline", "Fully offline"],
  growth: ["Lifestyle (stable income)", "Moderate growth", "High growth / scale fast"],
  client: ["No direct clients", "Minimal contact", "Regular contact", "High touch / relationship-based"],
  travel: ["No travel", "Occasional (1–2x/year)", "Regular (monthly)", "Frequent"],
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <label className="text-[12px] font-semibold text-[#151515]">{label}</label>
        {hint && <p className="text-[11px] text-[#9A9A9A] mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const GRADIENT = "radial-gradient(140.13% 256.85% at 0% 0%, #0A0A0A 25.96%, rgba(0,0,0,0) 81.25%), linear-gradient(114deg, #6366F1 34.62%, #8B5CF6 100%)";

export function ResourcesConstraintsForm() {
  const [form, setForm] = useAtom(resourcesConstraintsAtom);
  const setRecipeDirections = useSetAtom(recipeDirectionsAtom);
  const recipeDirections = useAtomValue(recipeDirectionsAtom);
  const { primaryCard } = useDirectionResult();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasNoDirections = !primaryCard && recipeDirections.length === 0;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("resourcesConstraints");
      if (stored) {
        const parsed = JSON.parse(stored);
        setForm(parsed);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key: keyof ResourcesConstraints, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem("resourcesConstraints", JSON.stringify(next)); } catch {}
      return next;
    });
    setSaved(false);
  };

  const hasAnyData = Object.values(form).some((v) => v.trim() !== "");

  const filledCount = Object.values(form).filter((v) => v.trim() !== "").length;

  const buildMessage = (f: ResourcesConstraints) => {
    const lines: string[] = [];
    if (f.networks) lines.push(`Networks & existing assets: ${f.networks}`);
    if (f.startingCapital) lines.push(`Available starting capital: ${f.startingCapital}`);
    if (f.financialRunway) lines.push(`Financial runway: ${f.financialRunway} months`);
    if (f.hoursPerWeek) lines.push(`Hours available per week: ${f.hoursPerWeek}`);
    if (f.locationFlexibility) lines.push(`Location flexibility: ${f.locationFlexibility}`);
    if (f.familyCommitments) lines.push(`Family/time commitments: ${f.familyCommitments}`);
    if (f.incomeFloor) lines.push(`Minimum income floor needed: ${f.incomeFloor}`);
    if (f.onlineVsOffline) lines.push(`Online vs offline preference: ${f.onlineVsOffline}`);
    if (f.growthAmbition) lines.push(`Growth ambition: ${f.growthAmbition}`);
    if (f.clientInteraction) lines.push(`Desired client interaction: ${f.clientInteraction}`);
    if (f.travelTolerance) lines.push(`Travel tolerance: ${f.travelTolerance}`);
    if (f.otherNotes) lines.push(`Other notes: ${f.otherNotes}`);
    return lines.join("\n");
  };

  const handleGenerate = async () => {
    const msg = buildMessage(form);
    if (!msg.trim()) return;
    setIsGenerating(true);
    try {
      const res = await authFetch("/api/direction-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          directionContext: { recommendedModel: null, compatibility: 0, directionText: "", alternatives: [], dnaScores: {} },
          recipeId: "generate-from-constraints",
          history: [],
        }),
      });
      const data = (await res.json()) as { reply: string };
      const card = parseDirectionCard(data.reply || "");
      if (card) {
        setRecipeDirections((prev) => {
          const updated = [...prev, card];
          try { localStorage.setItem("recipeDirections", JSON.stringify(updated)); } catch {}
          return updated;
        });
        setSaved(true);
        setIsOpen(false);
        // Scroll down so the new card is visible
        setTimeout(() => window.scrollBy({ top: 300, behavior: "smooth" }), 150);
      }
    } catch {}
    finally { setIsGenerating(false); }
  };

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
      className={cn(
        "relative rounded-[20px] overflow-hidden shadow-sm border border-gray-100 flex flex-col",
        isOpen ? "bg-white" : "cursor-pointer"
      )}
      style={!isOpen ? { background: GRADIENT } : undefined}
      onClick={!isOpen ? () => setIsOpen(true) : undefined}
    >
      {/* Spotlight overlay when collapsed */}
      {!isOpen && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.3)_0%,transparent_70%)] pointer-events-none z-0" />
      )}

      <AnimatePresence mode="wait">
        {isOpen ? (
          /* ── Expanded ── */
          <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Gradient header */}
            <div className="p-5 pb-4 flex flex-col" style={{ background: GRADIENT }}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-[13px] font-medium"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                {saved && (
                  <span className="text-[12px] text-white/70">Direction card added ↓</span>
                )}
              </div>
              <h3 className="text-[18px] font-medium text-white leading-snug tracking-tight">
                Resources &amp; Constraints
              </h3>
              <p className="text-[13px] text-white/70 mt-1">
                Help Sorene find directions that actually fit your life.
              </p>
            </div>

            {/* Form body */}
            <div className="p-5 space-y-7 bg-[#F9FAFB]">

              {/* What you have */}
              <section className="space-y-4">
                <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-widest">What you have</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Networks & existing assets" hint="Contacts, communities, platforms you already have access to">
                    <textarea
                      className={inputCls + " resize-none"}
                      rows={2}
                      placeholder="e.g. 500 LinkedIn contacts in finance, existing client list…"
                      value={form.networks}
                      onChange={(e) => update("networks", e.target.value)}
                    />
                  </Field>
                  <Field label="Available starting capital" hint="Budget you can commit without strain">
                    <input className={inputCls} placeholder="e.g. $5,000" value={form.startingCapital} onChange={(e) => update("startingCapital", e.target.value)} />
                  </Field>
                  <Field label="Financial runway" hint="Months you can go without stable income">
                    <input className={inputCls} type="number" min={0} placeholder="e.g. 6 months" value={form.financialRunway} onChange={(e) => update("financialRunway", e.target.value)} />
                  </Field>
                  <Field label="Hours per week" hint="Realistic hours you can commit right now">
                    <input className={inputCls} type="number" min={0} placeholder="e.g. 20 hrs/week" value={form.hoursPerWeek} onChange={(e) => update("hoursPerWeek", e.target.value)} />
                  </Field>
                </div>
              </section>

              {/* Your constraints */}
              <section className="space-y-4">
                <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-widest">Your constraints</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Location flexibility">
                    <select className={selectCls} value={form.locationFlexibility} onChange={(e) => update("locationFlexibility", e.target.value)}>
                      <option value="">Select…</option>
                      {SELECT_OPTS.location.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Family or time commitments" hint="Caregiving, school runs, fixed commitments">
                    <input className={inputCls} placeholder="e.g. two young kids, caregiver role…" value={form.familyCommitments} onChange={(e) => update("familyCommitments", e.target.value)} />
                  </Field>
                  <Field label="Minimum income floor" hint="The number you must hit to feel safe">
                    <input className={inputCls} placeholder="e.g. $3,000/month" value={form.incomeFloor} onChange={(e) => update("incomeFloor", e.target.value)} />
                  </Field>
                  <Field label="Online vs offline preference">
                    <select className={selectCls} value={form.onlineVsOffline} onChange={(e) => update("onlineVsOffline", e.target.value)}>
                      <option value="">Select…</option>
                      {SELECT_OPTS.online.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Growth ambition">
                    <select className={selectCls} value={form.growthAmbition} onChange={(e) => update("growthAmbition", e.target.value)}>
                      <option value="">Select…</option>
                      {SELECT_OPTS.growth.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Client interaction">
                    <select className={selectCls} value={form.clientInteraction} onChange={(e) => update("clientInteraction", e.target.value)}>
                      <option value="">Select…</option>
                      {SELECT_OPTS.client.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Travel tolerance">
                    <select className={selectCls} value={form.travelTolerance} onChange={(e) => update("travelTolerance", e.target.value)}>
                      <option value="">Select…</option>
                      {SELECT_OPTS.travel.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
              </section>

              {/* Other notes */}
              <section className="space-y-4">
                <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-widest">Anything else</p>
                <textarea
                  className={inputCls + " resize-none w-full"}
                  rows={3}
                  placeholder="Anything else Sorene should know about your situation…"
                  value={form.otherNotes}
                  onChange={(e) => update("otherNotes", e.target.value)}
                />
              </section>

              {/* Action */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !hasAnyData}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#151515] text-white text-[13px] font-semibold rounded-xl hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating && <Loader2 size={14} className="animate-spin" />}
                {isGenerating ? "Generating direction…" : "Generate Direction from My Constraints"}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── Collapsed card ── */
          <motion.div key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 p-5 flex flex-col min-h-[140px]">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <h3 className="text-[18px] font-medium text-white leading-snug tracking-tight">
                  Resources &amp; Constraints
                </h3>
                <p className="text-[13px] text-white/70 mt-1.5 leading-relaxed">
                  {hasNoDirections
                    ? "No directions yet — fill in your resources and constraints and Sorene will generate your first personalised direction."
                    : "Tell Sorene what you have and what limits you — get directions that fit your real life."}
                </p>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between">
              {hasAnyData ? (
                <span className="text-[12px] text-white/60">{filledCount} field{filledCount !== 1 ? "s" : ""} saved</span>
              ) : (
                <span className="text-[12px] text-white/50">Not filled in yet</span>
              )}
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/80">
                {hasNoDirections && !hasAnyData ? "Get started" : "Fill in"}
                <ChevronDown size={14} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
