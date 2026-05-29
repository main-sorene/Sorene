"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [dnaComplete, setDnaComplete] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }
    if (!loading && user) {
      const onboardingKey = `sorene_onboarding_complete_${user.uid}`;
      const isComplete = localStorage.getItem(onboardingKey);
      if (!isComplete) {
        router.replace("/onboarding");
        return;
      }
      const profileKey = `sorene_profile_${user.uid}`;
      const raw = localStorage.getItem(profileKey);
      if (raw) {
        try {
          const profile = JSON.parse(raw);
          setFirstName(profile.firstName || null);
        } catch {
          // ignore parse errors
        }
      }
      const dnaKey = `sorene_dna_complete_${user.uid}`;
      setDnaComplete(!!localStorage.getItem(dnaKey));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-400 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome{firstName ? `, ${firstName}` : ""}.
          </h1>
          <button
            onClick={signOut}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign out
          </button>
        </div>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">DNA Assessment</CardTitle>
            <CardDescription>
              Your personalized entrepreneurship profile starts here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              {dnaComplete
                ? "Your DNA profile is ready. Explore your personalized direction."
                : "Answer 12 questions to build your entrepreneurship DNA profile."}
            </p>
            {dnaComplete ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/assessment/complete">View Your DNA Profile →</Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-900 text-slate-900 hover:bg-slate-50">
                  <Link href="/direction">See Your Direction →</Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                <Link href="/assessment">Start Assessment →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
