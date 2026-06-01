"use client";

import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/firestore";

export function useDnaData() {
  const user = useAtomValue(userAtom);

  return useQuery({
    queryKey: ["dna", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const profile = await getUserProfile(user.uid);
      return profile;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}
