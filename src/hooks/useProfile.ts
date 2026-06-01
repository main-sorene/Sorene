import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { authApi } from "@/lib/authApi";

export function useProfile() {
  const user = useAtomValue(userAtom);

  return useQuery({
    queryKey: ["profile", user?.uid],
    queryFn: () => authApi.getProfile(user!.uid),
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
