"use client";

import { motion } from "framer-motion";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

interface MetricRowProps {
  label: string;
  value: string;
  description: string;
  valueColor?: string;
}

const MetricRow = ({
  label,
  value,
  description,
  valueColor,
}: MetricRowProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col md:flex-row py-6 border-b border-gray-100 last:border-0"
  >
    <div className="w-full md:w-1/3 mb-2 md:mb-0">
      <p className="font-medium text-sm">{label}</p>
    </div>
    <div className="flex-1">
      <h4
        className={cn(
          "text-2xl font-medium mb-1 capitalize",
          valueColor || "text-gray-900",
        )}
      >
        {value}
      </h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  </motion.div>
);

export function YourCoreDetail() {
  const router = useRouter();
  const { data: profileRes, isLoading } = useProfile();

  const core = profileRes?.dnaScores;

  console.log("Core ========> ", core);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-20"
    >
      {/* Header with Gradient */}
      <div
        className="relative pt-6 pb-6 px-2 rounded-t-4xl overflow-hidden shadow-lg mt-5"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #FFD500 0%, #FF4F45 45%, #008CFF 67%, #007A33 100%)",
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
            <button className="text-white/80 hover:text-white">
              <MoreHorizontal size={24} />
            </button>
          </div>

          <h2 className="text-4xl font-medium text-white mb-6 tracking-tight">
            Your Core
          </h2>
          <p className="text-white/90 text-sm max-w-2xl leading-relaxed">
            {core?.strengths_summary ||
              "Someone who cares deeply about doing things well and doing it right. You're not chasing speed or noise. You care about quality, clarity, and doing things properly."}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl px-8 mt-12">
        <h3 className="text-xl font-medium text-gray-900 mb-8">Key Signals</h3>

        <div className="flex flex-col">
          <MetricRow
            label="Primary Motivation"
            value={core?.motivation_driver || "Mastery"}
            description="You care about doing things well, not just finishing them."
          />
          <MetricRow
            label="Energy Source"
            value={core?.energy_source || "Guided"}
            description="What fuels you and keeps you going."
          />
          <MetricRow
            label="Energy Drains"
            value={core?.energy_drains || "Chaos"}
            description="What depletes your energy and focus."
          />
          <MetricRow
            label="Non-Negotiable"
            value={core?.non_negotiable || "Quality"}
            description="The thing you won't compromise on."
          />

          {/* Risk Profile (Special Grid Layout) */}
          <div className="flex flex-col md:flex-row py-6 border-b border-gray-100">
            <div className="w-full md:w-1/3 mb-2 md:mb-0">
              <p className="font-medium text-sm">Risk Profile</p>
            </div>
            <div className="flex-1">
              <div className="flex gap-12 mb-6">
                <div>
                  <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                    Risk Score
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {core?.risk_score ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                    Readiness Score
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {core?.readiness_score ?? "—"}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                You're willing to take practical risks, but not chaotic ones.
              </p>
            </div>
          </div>

          <MetricRow
            label="Structure Score"
            value={core?.structure_score?.toString() || "High"}
            description="How much you prefer clear frameworks and process."
            valueColor="text-emerald-500/80"
          />
          <MetricRow
            label="Uncertainty Score"
            value={core?.uncertainty_score?.toString() || "Medium"}
            description="How you handle ambiguity and unclear situations."
          />
        </div>

        {/* Strength Pattern Section */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-gray-900 mb-8">
            Strength Pattern
          </h3>
          <div className="flex flex-wrap gap-3">
            {(
              [
                "Adaptability",
                "Systems Thinking",
                "Quality Focus",
              ]
            ).map((strength, index) => {
              const variants = [
                "bg-emerald-50 text-emerald-700 border-emerald-100",
                "bg-blue-50 text-blue-700 border-blue-100",
                "bg-purple-50 text-purple-700 border-purple-100",
              ];
              const variant = variants[index % variants.length];
              return (
                <span
                  key={strength}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-medium border shadow-sm",
                    variant,
                  )}
                >
                  {strength}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
