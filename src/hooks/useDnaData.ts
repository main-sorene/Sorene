"use client";

import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/firestore";
import { authApi } from "@/lib/authApi";

export function useDnaData() {
  const user = useAtomValue(userAtom);

  return useQuery({
    queryKey: ["dna", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const [firestoreProfile, externalProfile] = await Promise.allSettled([
        getUserProfile(user.uid),
        authApi.getProfile(user.uid),
      ]);
      const firestore = firestoreProfile.status === "fulfilled" ? firestoreProfile.value : null;
      const external = externalProfile.status === "fulfilled" ? externalProfile.value : null;
      return {
        ...firestore,
        externalProfile: external?.profile ?? null,
      };
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    // Use the already-loaded atom profile as placeholder so the spinner never
    // shows when navigating back to the DNA section.
    placeholderData: user?.profile ? { ...user.profile, externalProfile: null } : undefined,
    // Keep cache alive for 30 minutes so re-navigation doesn't re-fetch.
    gcTime: 30 * 60 * 1000,
  });
}
