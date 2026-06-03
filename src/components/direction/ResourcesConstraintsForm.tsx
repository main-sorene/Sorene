"use client";

import { useState, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { resourcesConstraintsAtom, EMPTY_RESOURCES, ResourcesConstraints, recipeDirectionsAtom, RecipeDirection } from "@/store/atoms";
import { authFetch } from "@/lib/authFetch";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

function parseDirectionCard(text: string): RecipeDirection | null {
  const titleMatch = text.match(/\*{0,2}Direction:\s*([^\n*]+?)\*{0,2}\n/i);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim().replace(/^["'"']+|["'"']+$/g, "").trim();
  const afterTitle = text.slice(text.indexOf(titleMatch[0]) + titleMatch[0].length).trim();
  const descEnd = afterTitle.search(/\*{0,2}Why it fits you\*{0,2}/i);
  const description = (descEnd > 0 ? afterTitle.slice(0, descEnd) : afterTitle.slice(0, 300)).trim();
  const whySection = afterTitle.match(/\*{0,2}Why it fits you\*{0,2}[:\n]+([\s\S]*?)(?=\*{0,2}Key risks\*{0,2}|\*{0,2}Your first step\*{0,2}|$)/i);
  const risksSection = afterTitle.match(/\*{0,2}Key risks\*{0,2}[:\n]+([\s\S]*?)(?=\*{0,2}Your first step\*{0,2}|$)/i);
  const stepSection = afterTitle.match(/\*{0,2}Your first step\*{0,2}[:\n]+([\s\S]*?)$/i);
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
    firstStep: (stepSection?.[1] ?? "").trim(),
    score,
    rawContent: text,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#62646A]">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm text-[#111111] bg-[#F8F9FA] border border-[#ECEDEE] rounded-lg outline-none focus:border-[#D1D5DB] focus:bg-white transition-colors placeholder:text-[#9CA3AF]";
const selectCls = inputCls + " appearance-none cursor-pointer";

const SELECT_OPTS = {
  location: ["Fully remote", "Local only", "Can travel occasionally", "Very flexible"],
  online: ["Fully online", "Prefer online", "Mix of both", "Prefer offline", "Fully offline"],
  growth: ["Lifestyle (stable income)", "Moderate growth", "High growth / scale fast"],
  client: ["No direct clients", "Minimal contact", "Regular contact", "High touch / relationship-based"],
  travel: ["No travel", "Occasional (1–2x/year)", "Regular (monthly)", "Frequent"],
};

export function ResourcesConstraintsForm() {
  const [form, setForm] = useAtom(resourcesConstraintsAtom);
  const setRecipeDirections = useSetAtom(recipeDirectionsAtom);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("resourcesConstraints");
      if (stored) {
        const parsed = JSON.parse(stored);
        setForm(parsed);
        // If they have data, open the form
        const hasData = Object.values(parsed).some((v) => (v as string).trim() !== "");
        if (hasData) setIsOpen(true);
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
      }
    } catch {}
    finally { setIsGenerating(false); }
  };

  return (
    <div className="mx-3 mb-2 lg:mx-0 rounded-2xl border border-[#ECEDEE] bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#111111]">Resources &amp; Constraints</span>
          {hasAnyData && !isOpen && (
            <span className="text-xs text-[#9CA3AF] font-normal">saved</span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} className="text-[#9CA3AF]" /> : <ChevronDown size={16} className="text-[#9CA3AF]" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-6 border-t border-[#F3F4F6]">
          {/* What you have */}
          <div className="pt-4 space-y-4">
            <p className="text-xs font-semibold text-[#111111] uppercase tracking-wide">What you have</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Networks + existing assets">
                <textarea
                  className={inputCls + " resize-none"}
                  rows={2}
                  placeholder="e.g. 500 LinkedIn contacts in finance, existing client list…"
                  value={form.networks}
                  onChange={(e) => update("networks", e.target.value)}
                />
              </Field>
              <Field label="Available starting capital">
                <input className={inputCls} placeholder="e.g. $5,000" value={form.startingCapital} onChange={(e) => update("startingCapital", e.target.value)} />
              </Field>
              <Field label="Financial runway (months)">
                <input className={inputCls} type="number" min={0} placeholder="e.g. 6" value={form.financialRunway} onChange={(e) => update("financialRunway", e.target.value)} />
              </Field>
              <Field label="Hours available per week">
                <input className={inputCls} type="number" min={0} placeholder="e.g. 20" value={form.hoursPerWeek} onChange={(e) => update("hoursPerWeek", e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Your constraints */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#111111] uppercase tracking-wide">Your constraints</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Location flexibility">
                <select className={selectCls} value={form.locationFlexibility} onChange={(e) => update("locationFlexibility", e.target.value)}>
                  <option value="">Select…</option>
                  {SELECT_OPTS.location.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Family or time commitments">
                <input className={inputCls} placeholder="e.g. two young kids, caregiver role…" value={form.familyCommitments} onChange={(e) => update("familyCommitments", e.target.value)} />
              </Field>
              <Field label="Minimum income floor needed">
                <input className={inputCls} placeholder="e.g. $3,000/month" value={form.incomeFloor} onChange={(e) => update("incomeFloor", e.target.value)} />
              </Field>
              <Field label="Online vs offline preference">
                <select className={selectCls} value={form.onlineVsOffline} onChange={(e) => update("onlineVsOffline", e.target.value)}>
                  <option value="">Select…</option>
                  {SELECT_OPTS.online.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Growth ambition level">
                <select className={selectCls} value={form.growthAmbition} onChange={(e) => update("growthAmbition", e.target.value)}>
                  <option value="">Select…</option>
                  {SELECT_OPTS.growth.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Desired client interaction">
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
          </div>

          {/* Other notes */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#111111] uppercase tracking-wide">Other notes</p>
            <textarea
              className={inputCls + " resize-none w-full"}
              rows={3}
              placeholder="Anything else Sorene should know about your situation…"
              value={form.otherNotes}
              onChange={(e) => update("otherNotes", e.target.value)}
            />
          </div>

          {/* Action */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !hasAnyData}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 size={15} className="animate-spin" /> : null}
              {isGenerating ? "Generating…" : "Generate Direction"}
            </button>
            {saved && <span className="text-xs text-[#6B7280]">New direction card added below ↓</span>}
          </div>
        </div>
      )}
    </div>
  );
}
