import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom, ideationAtom } from "@/store/atoms";
import { getIdeate } from "@/lib/chatApi";
import { useEffect } from "react";

export function useDirection() {
  const user = useAtomValue(userAtom);
  const setIdeation = useSetAtom(ideationAtom);

  const query = useQuery({
    queryKey: ["direction", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const data = await getIdeate(user.uid);
      setIdeation(data);
      return data;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  useEffect(() => {
    if (query.data) {
      setIdeation(query.data);
    }
  }, [query.data, setIdeation]);

  return query;
}
