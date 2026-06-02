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
      console.log("[useDnaData] externalProfile raw:", external);
      console.log("[useDnaData] externalProfile.profile:", external?.profile);
      return {
        ...firestore,
        externalProfile: external?.profile ?? null,
      };
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}
