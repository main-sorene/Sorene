"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface DnaProfile {
  energySource: string;
  workMode: string;
  timeConstraint: string;
  financialTimeline: string;
  nonNegotiable: string;
  uncertaintyStyle: string;
  readiness: string;
}

function truncate(str: string, len = 120): string {
  if (!str) return "";
  return str.length > len ? str.slice(0, len).trimEnd() + "..." : str;
}

function InsightCard({
  label,
  summary,
}: {
  label: string;
  summary: string;
}) {
  return (
    <div className="border border-slate-200 rounded-lg px-5 py-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className="text-sm text-slate-800 leading-relaxed">{summary}</p>
    </div>
  );
}

export default function AssessmentCompletePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<DnaProfile | null>(null);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }

    const onboardingKey = `sorene_onboarding_complete_${user.uid}`;
    if (!localStorage.getItem(onboardingKey)) {
      router.replace("/onboarding");
      return;
    }

    // Load profile name
    const profileKey = `sorene_profile_${user.uid}`;
    const rawProfile = localStorage.getItem(profileKey);
    if (rawProfile) {
      try {
        const p = JSON.parse(rawProfile);
        setFirstName(p.firstName || "");
      } catch {
        // ignore
      }
    }

    // Load answers
    const answersKey = `sorene_dna_answers_${user.uid}`;
    const rawAnswers = localStorage.getItem(answersKey);
    let ans: Record<string, string> = {};
    if (rawAnswers) {
      try {
        ans = JSON.parse(rawAnswers);
      } catch {
        // ignore
      }
    }

    // Build DNA profile from answers
    const q1 = ans["q1_energy"] || "";
    const q2 = ans["q2_pattern"] || "";
    const q4 = ans["q4_time"] || "";
    const q5 = ans["q5_finance"] || "";
    const q6 = ans["q6_tradeoff"] || "";
    const q7 = ans["q7_uncertainty"] || "";
    const q8 = ans["q8_workmode"] || "";
    const q10 = ans["q10_regret"] || "";
    const q11 = ans["q11_readiness"] || "";

    const energySource = q1
      ? `You're energized by: ${truncate(q1)}${q2 ? ` This kind of work showed up ${q2.split(" — ")[0].toLowerCase()} in your past roles.` : ""}`
      : "Not yet captured.";

    const workMode = q8
      ? `You work best ${q8.split(" — ")[0].toLowerCase()}.${
          ans["q8_workmode_followup"]
            ? ` ${truncate(ans["q8_workmode_followup"])}`
            : ""
        }`
      : "Not yet captured.";

    const timeConstraint = q4
      ? `You have ${q4.split(" — ")[0].toLowerCase()} available per week.${
          q5 ? ` Income-wise, you need results ${q5.split(" — ")[0].toLowerCase()}.` : ""
        }`
      : "Not yet captured.";

    const financialTimeline = q5
      ? `${q5}.`
      : "Not yet captured.";

    const nonNegotiable = q6
      ? `The situation you'd find hardest to live with: "${q6.split(" — ")[0]}."${
          ans["q6_tradeoff_followup"]
            ? ` ${truncate(ans["q6_tradeoff_followup"])}`
            : ""
        }`
      : "Not yet captured.";

    const uncertaintyStyle = [
      q7 ? `When things are uncertain, you tend to: ${q7.split(" — ")[0].toLowerCase()}.` : "",
      q10 ? `${q10.includes("Not trying") ? "You're more afraid of regret than failure." : q10.includes("Trying and failing") ? "You're more cautious about wasted effort than missed opportunities." : `Your regret orientation: ${q10.split(" — ")[0].toLowerCase()}.`}` : "",
    ]
      .filter(Boolean)
      .join(" ") || "Not yet captured.";

    const readiness = q11
      ? `Right now you're ${q11.split(" — ")[0].toLowerCase()}.${
          ans["q11_readiness_followup"]
            ? ` ${truncate(ans["q11_readiness_followup"])}`
            : ""
        }`
      : "Not yet captured.";

    setProfile({
      energySource,
      workMode,
      timeConstraint,
      financialTimeline,
      nonNegotiable,
      uncertaintyStyle,
      readiness,
    });

    // Save completion flag
    localStorage.setItem(`sorene_dna_complete_${user.uid}`, "true");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-6">
            DNA Assessment Complete
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Your DNA Profile{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-10">
            Built from your answers — this is how Sorene understands you.
          </p>
        </div>

        {/* Insights */}
        {profile ? (
          <div className="flex flex-col gap-4 mb-10">
            <InsightCard
              label="What energizes you"
              summary={profile.energySource}
            />
            <InsightCard
              label="How you work best"
              summary={profile.workMode}
            />
            <InsightCard
              label="Your constraints right now"
              summary={profile.timeConstraint}
            />
            <InsightCard
              label="What you won't compromise on"
              summary={profile.nonNegotiable}
            />
            <InsightCard
              label="How you handle uncertainty"
              summary={profile.uncertaintyStyle}
            />
            <InsightCard
              label="Where you are now"
              summary={profile.readiness}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="border border-slate-100 rounded-lg px-5 py-4 h-20 bg-slate-50 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/direction"
            className="w-full bg-slate-900 text-white text-sm px-6 py-3 rounded-md text-center hover:bg-slate-800 transition-colors"
          >
            See Your Direction →
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-slate-600 text-center transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
