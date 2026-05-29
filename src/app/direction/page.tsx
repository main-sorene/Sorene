"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { computeDirection, type DirectionEligibility } from "@/lib/dnaEngine";

export default function DirectionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [eligibility, setEligibility] = useState<DirectionEligibility | null>(null);
  const [directionText, setDirectionText] = useState("");
  const [loadingText, setLoadingText] = useState(true);
  const [error, setError] = useState(false);

  const fetchDirection = async (
    elig: DirectionEligibility,
    firstName: string,
    rawAnswers: Record<string, string>
  ) => {
    setLoadingText(true);
    setError(false);
    setDirectionText("");

    try {
      const response = await fetch("/api/direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eligibility: elig, firstName, rawAnswers }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Bad response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setDirectionText(text);
      }
    } catch {
      setError(true);
    } finally {
      setLoadingText(false);
    }
  };

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

    const dnaKey = `sorene_dna_complete_${user.uid}`;
    if (!localStorage.getItem(dnaKey)) {
      router.replace("/assessment");
      return;
    }

    // Load profile
    let firstName = "";
    const profileRaw = localStorage.getItem(`sorene_profile_${user.uid}`);
    if (profileRaw) {
      try {
        const p = JSON.parse(profileRaw);
        firstName = p.firstName || "";
      } catch {
        // ignore
      }
    }

    // Load answers
    let rawAnswers: Record<string, string> = {};
    const answersRaw = localStorage.getItem(`sorene_dna_answers_${user.uid}`);
    if (answersRaw) {
      try {
        rawAnswers = JSON.parse(answersRaw);
      } catch {
        // ignore
      }
    }

    const elig = computeDirection(rawAnswers);
    setEligibility(elig);

    fetchDirection(elig, firstName, rawAnswers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const modelLabel = eligibility
    ? eligibility.eligible
      ? eligibility.model
      : "Strengthen First"
    : null;

  const paragraphs = directionText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

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
        <div className="mb-10">
          <span className="text-lg font-semibold text-slate-900">Sorene</span>
        </div>

        {/* Model chip — shown after loading */}
        {!loadingText && !error && modelLabel && (
          <div className="mb-6">
            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">
              {modelLabel}
            </span>
          </div>
        )}

        {/* Loading state */}
        {loadingText && (
          <div>
            <p className="text-sm text-slate-500 mb-6 animate-pulse">
              Sorene is reading your profile...
            </p>
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-slate-200 rounded animate-pulse"
                  style={{ width: i === 3 ? "60%" : "100%" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => {
                if (!user) return;
                let firstName = "";
                const profileRaw = localStorage.getItem(`sorene_profile_${user.uid}`);
                if (profileRaw) {
                  try { firstName = JSON.parse(profileRaw).firstName || ""; } catch { /* ignore */ }
                }
                let rawAnswers: Record<string, string> = {};
                const answersRaw = localStorage.getItem(`sorene_dna_answers_${user.uid}`);
                if (answersRaw) {
                  try { rawAnswers = JSON.parse(answersRaw); } catch { /* ignore */ }
                }
                if (eligibility) fetchDirection(eligibility, firstName, rawAnswers);
              }}
              className="text-sm text-slate-900 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Direction text */}
        {!loadingText && !error && paragraphs.length > 0 && (
          <div className="flex flex-col gap-5 mb-10">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-slate-800 leading-relaxed text-[15px]">
                {p}
              </p>
            ))}
          </div>
        )}

        {/* CTAs */}
        {!loadingText && !error && directionText && (
          <div className="flex flex-col gap-3 mt-8">
            <button
              disabled
              className="w-full bg-slate-900 text-white text-sm px-6 py-3 rounded-md opacity-60 cursor-not-allowed"
            >
              Continue to Execution Hub →
            </button>
            <Link
              href="/assessment/complete"
              className="text-sm text-slate-400 hover:text-slate-600 text-center transition-colors"
            >
              Back to your DNA profile
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
