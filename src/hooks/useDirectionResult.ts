"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { useQuery } from "@tanstack/react-query";

export function useDirectionResult() {
  const user = useAtomValue(userAtom);
  const [streamedText, setStreamedText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStreamed, setHasStreamed] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["direction-profile", user?.uid],
    queryFn: () => getUserProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!profile || hasStreamed) return;

    // If we already have a cached direction text, use it
    if (profile.directionText) {
      setStreamedText(profile.directionText);
      setHasStreamed(true);
      return;
    }

    // If no eligibility data yet, skip
    if (!profile.directionEligibility || !profile.assessmentAnswers) return;

    // Stream from /api/direction
    const stream = async () => {
      setIsStreaming(true);
      setHasStreamed(true);
      try {
        const firstName = profile.firstName || "there";
        const res = await fetch("/api/direction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eligibility: {
              eligible: profile.directionEligibility!.eligible,
              model: profile.directionEligibility!.model,
              reason: profile.directionEligibility!.reason,
              scores: profile.dnaScores,
            },
            firstName,
            rawAnswers: profile.assessmentAnswers,
          }),
        });

        if (!res.ok || !res.body) {
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamedText(fullText);
        }

        // Cache the result in Firestore
        if (user?.uid && fullText) {
          await saveUserProfile(user.uid, { directionText: fullText });
        }
      } finally {
        setIsStreaming(false);
      }
    };

    stream();
  }, [profile, hasStreamed, user]);

  return {
    directionText: streamedText,
    isLoading: isLoading || isStreaming,
    eligibility: profile?.directionEligibility,
    model: profile?.directionEligibility?.eligible ? profile.directionEligibility.model : null,
  };
}
