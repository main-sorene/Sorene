import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { getSubscriptionStatus } from "@/lib/subscriptionApi";

export const subscriptionQueryKey = (email: string) => ["subscription", email];

export function useSubscriptionStatus() {
  const user = useAtomValue(userAtom);
  const email = user?.email ?? user?.profile?.email ?? null;

  return useQuery({
    queryKey: subscriptionQueryKey(email ?? ""),
    queryFn: () => getSubscriptionStatus(email!),
    enabled: !!email,
    staleTime: 0,
    retry: 1,
  });
}

export const paymentMethodQueryKey = (email: string) => ["payment-method", email];

export function usePaymentMethod(enabled: boolean = true) {
  const user = useAtomValue(userAtom);
  const email = user?.email ?? user?.profile?.email ?? null;

  return useQuery({
    queryKey: paymentMethodQueryKey(email ?? ""),
    queryFn: () => import("@/lib/subscriptionApi").then(m => m.getPaymentMethod(email!)),
    enabled: !!email && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export const invoicesQueryKey = (email: string) => ["invoices", email];

export function useInvoices(page: number = 1, limit: number = 10, enabled: boolean = true) {
  const user = useAtomValue(userAtom);
  const email = user?.email ?? user?.profile?.email ?? null;

  return useQuery({
    queryKey: [...invoicesQueryKey(email ?? ""), page, limit],
    queryFn: () => import("@/lib/subscriptionApi").then(m => m.getInvoices(email!, page, limit)),
    enabled: !!email && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useRefetchSubscriptionStatus() {
  const queryClient = useQueryClient();
  const user = useAtomValue(userAtom);
  const email = user?.email ?? user?.profile?.email ?? null;

  return () => {
    if (email) {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKey(email) });
    }
  };
}
