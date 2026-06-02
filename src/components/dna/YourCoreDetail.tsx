"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDnaData } from "@/hooks/useDnaData";
import { mapProfileToDNA } from "@/lib/dnaMapping";

interface MetricRowProps {
  label: string;
  value: string;
  description: string;
  valueColor?: string;
}

const MetricRow = ({ label, value, description, valueColor }: MetricRowProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col md:flex-row py-6 border-b border-gray-100 last:border-0"
  >
    <div className="w-full md:w-1/3 mb-2 md:mb-0">
      <p className="font-medium text-sm text-gray-500">{label}</p>
    </div>
    <div className="flex-1">
      <h4 className={cn("text-xl font-medium mb-1 capitalize", valueColor || "text-gray-900")}>
        {value}
      </h4>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export function YourCoreDetail() {
  const router = useRouter();
  const { data: profile, isLoading } = useDnaData();

  const scores = profile?.dnaScores;
  const externalProfile = profile?.externalProfile;

  // Use rich external profile if available, otherwise fall back to dnaScores
  const dnaItems = externalProfile ? mapProfileToDNA(externalProfile) : null;
  const coreItem = dnaItems?.find((i) => i.core_id === "your_core");

  const riskLabel = scores ? (scores.risk_score >= 8 ? "High" : scores.risk_score >= 5 ? "Medium" : "Low") : "—";
  const readinessLabel = scores ? (scores.readiness_score >= 7 ? "Ready" : scores.readiness_score >= 5 ? "Deciding" : "Exploring") : "—";
  const structureLabel = scores ? (scores.structure_score >= 8 ? "Independent" : scores.structure_score >= 6 ? "Small Team" : "Collaborative") : "—";
  const uncertaintyLabel = scores ? (scores.uncertainty_score >= 8 ? "High" : scores.uncertainty_score >= 5 ? "Medium" : "Low") : "—";

  const headerDescription = coreItem?.description || scores?.strengths_summary || "Your unique strengths and energy patterns define how you work best.";
  const motivationValue = coreItem?.key_signals?.find(s => s.label === "Primary Motivation")?.value || scores?.motivation_driver || "—";
  const motivationDesc = coreItem?.key_signals?.find(s => s.label === "Primary Motivation")?.explanation || "What drives your decisions and actions.";
  const strengthPatterns: string[] = coreItem?.strength_patterns || (scores?.energy_source ? [scores.energy_source.slice(0, 40)] : []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-20">
      {/* Header */}
      <div
        className="relative pt-6 pb-8 px-2 rounded-t-4xl overflow-hidden shadow-lg mt-5"
        style={{
          background: "radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0, 0, 0, 0.00) 100%), linear-gradient(180deg, #16B364 0%, #ECFCCB 100%)",
        }}
      >
        <div className="mx-6">
          <div className="flex justify-between items-center mb-12">
            <button
              onClick={() => router.push("/dna")}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeft size={20} />
              Back to summary
            </button>
          </div>
          <h2 className="text-4xl font-medium text-white mb-4 tracking-tight">Your Core</h2>
          <p className="text-white/85 text-sm max-w-2xl leading-relaxed">{headerDescription}</p>
        </div>
      </div>

      {/* Key Signals */}
      <div className="max-w-4xl px-8 mt-12">
        <h3 className="text-xl font-medium text-gray-900 mb-8">Key Signals</h3>
        <div className="flex flex-col">
          <MetricRow
            label="Primary Motivation"
            value={motivationValue}
            description={motivationDesc}
          />
          <MetricRow
            label="Energy Source"
            value={scores?.energy_source?.slice(0, 60) || "—"}
            description="What fuels you and keeps you going."
          />
          <MetricRow
            label="Energy Drains"
            value={scores?.energy_drains?.slice(0, 60) || "—"}
            description="What depletes your energy and focus."
          />
          <MetricRow
            label="Strengths & Edges"
            value={scores?.non_negotiable?.slice(0, 60) || "—"}
            description="What you won't compromise on, and where you push hardest."
          />

          {/* Risk Profile */}
          <div className="flex flex-col md:flex-row py-6 border-b border-gray-100">
            <div className="w-full md:w-1/3 mb-2 md:mb-0">
              <p className="font-medium text-sm text-gray-500">Risk Profile</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-12 mb-4">
                <div>
                  <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Risk Level</p>
                  <p className="text-2xl font-semibold text-gray-900">{riskLabel}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Readiness</p>
                  <p className="text-2xl font-semibold text-gray-900">{readinessLabel}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">How willing you are to take risks and how ready you are to act.</p>
            </div>
          </div>

          <MetricRow
            label="Structure Preference"
            value={structureLabel}
            description="How much you prefer clear frameworks and defined processes."
            valueColor="text-emerald-600"
          />
          <MetricRow
            label="Uncertainty Tolerance"
            value={uncertaintyLabel}
            description="How you handle ambiguity and unclear situations."
          />
        </div>

        {/* Strength Patterns */}
        {strengthPatterns.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-medium text-gray-900 mb-6">Strength Patterns</h3>
            <div className="flex flex-wrap gap-3">
              {strengthPatterns.map((strength, index) => {
                const variants = [
                  "bg-emerald-50 text-emerald-700 border-emerald-100",
                  "bg-blue-50 text-blue-700 border-blue-100",
                  "bg-purple-50 text-purple-700 border-purple-100",
                  "bg-amber-50 text-amber-700 border-amber-100",
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
