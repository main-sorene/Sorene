"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDnaData } from "@/hooks/useDnaData";

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—";

function valueColor(val: string): string {
  const v = val.toLowerCase();
  if (["high", "strong", "ready", "committed", "stable", "full"].some(w => v.includes(w)))
    return "text-emerald-600";
  if (["low", "limited", "depleted", "stuck"].some(w => v.includes(w)))
    return "text-red-500";
  if (["medium", "moderate", "deciding", "variable"].some(w => v.includes(w)))
    return "text-amber-500";
  return "text-gray-900";
}

interface MetricRowProps {
  label: string;
  value: string;
  description?: string;
}

const MetricRow = ({ label, value, description }: MetricRowProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col md:flex-row py-6 border-b border-gray-100 last:border-0"
  >
    <div className="w-full md:w-1/3 mb-1 md:mb-0">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
    <div className="flex-1">
      <h4 className={cn("text-2xl font-medium mb-1 capitalize", valueColor(value))}>
        {capitalize(value)}
      </h4>
      {description && <p className="text-gray-400 text-sm leading-relaxed">{description}</p>}
    </div>
  </motion.div>
);

export function YourCoreDetail() {
  const router = useRouter();
  const { data: profile, isLoading } = useDnaData();

  const core = profile?.externalProfile?.core;
  const scores = profile?.dnaScores;
  const strengthProfile = profile?.externalProfile?.strength_profile;

  // Build a deep founder DNA sentence from core values
  const founderSentence = core
    ? `${capitalize(core.primary_motivation)}-driven, ${core.structure_preference?.toLowerCase().replace(/_/g, " ")}-structured, and ${core.collaboration_mode?.toLowerCase().replace(/_/g, " ")} by nature — you bring ${core.execution_bias?.toLowerCase().replace(/_/g, " ") || "focused execution"} to everything you build.`
    : scores?.strengths_summary || "Your unique combination of drive, structure, and values defines how you work best.";

  const strengthPatterns: string[] = strengthProfile?.strengths?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-20">
      {/* Header */}
      <div
        className="relative pt-6 pb-8 px-2 rounded-t-4xl overflow-hidden shadow-lg mt-5"
        style={{
          background: "radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #ECFCCB 100%)",
        }}
      >
        <div className="mx-4 md:mx-6">
          <div className="flex justify-between items-center mb-8 md:mb-12">
            <button
              onClick={() => router.push("/dna")}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeft size={20} />
              Back to summary
            </button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <img src="/figmaAssets/dna.svg" alt="" className="w-6 h-6 opacity-80" />
            <h2 className="text-3xl font-medium text-white tracking-tight">Your Core</h2>
          </div>
          <p className="text-white/85 text-sm max-w-2xl leading-relaxed">{founderSentence}</p>
        </div>
      </div>

      {/* Key Signals */}
      <div className="max-w-4xl px-4 md:px-8 mt-12">
        <h3 className="text-xl font-medium text-gray-900 mb-8">Key Signals</h3>
        <div className="flex flex-col">

          <MetricRow
            label="Primary Motivation"
            value={core?.primary_motivation || scores?.motivation_driver?.split(" ").slice(0, 2).join(" ") || "—"}
            description={core?.description?.primary_motivation || "What drives your decisions and actions."}
          />

          <MetricRow
            label="Structure Preference"
            value={core?.structure_preference || "—"}
            description={core?.description?.structure_preference || "How you prefer to organize your work."}
          />

          <MetricRow
            label="Collaboration Mode"
            value={core?.collaboration_mode || "—"}
            description={core?.description?.collaboration_mode || "How you work best with others."}
          />

          <MetricRow
            label="Ambiguity Tolerance"
            value={core?.ambiguity_tolerance || "—"}
            description={core?.description?.ambiguity_tolerance || "How you handle unclear or uncertain situations."}
          />

          {/* Risk Profile — two columns */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row py-6 border-b border-gray-100"
          >
            <div className="w-full md:w-1/3 mb-2 md:mb-0">
              <p className="text-sm text-gray-500 font-medium">Risk Profile</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-8 md:gap-12 mb-3">
                <div>
                  <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Emotional Risk</p>
                  <p className={cn("text-2xl font-medium capitalize", valueColor(core?.risk_emotional || ""))}>
                    {capitalize(core?.risk_emotional || scores?.risk_score?.toString() || "—")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Financial Risk</p>
                  <p className={cn("text-2xl font-medium capitalize", valueColor(core?.risk_financial || ""))}>
                    {capitalize(core?.risk_financial || "—")}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                {core?.description?.risk_emotional || "You're willing to take practical risks, but not chaotic ones."}
              </p>
            </div>
          </motion.div>

          <MetricRow
            label="Time Availability"
            value={core?.time_availability || "—"}
            description={core?.description?.time_availability || "How much capacity you can commit to this work."}
          />

          <MetricRow
            label="Readiness Level"
            value={core?.readiness_level || "—"}
            description={core?.description?.readiness_level || "Where you are on the path to taking action."}
          />

        </div>

        {/* Strength Patterns */}
        {strengthPatterns.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-medium text-gray-900 mb-6">Strength Pattern</h3>
            <div className="flex flex-wrap gap-3">
              {strengthPatterns.map((strength, index) => {
                const variants = [
                  "bg-emerald-50 text-emerald-700 border-emerald-100",
                  "bg-blue-50 text-blue-700 border-blue-100",
                  "bg-purple-50 text-purple-700 border-purple-100",
                  "bg-amber-50 text-amber-700 border-amber-100",
                  "bg-rose-50 text-rose-700 border-rose-100",
                ];
                return (
                  <span
                    key={strength}
                    className={cn("px-5 py-2.5 rounded-full text-sm font-medium border shadow-sm", variants[index % variants.length])}
                  >
                    {strength}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
