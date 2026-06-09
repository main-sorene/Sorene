"use client";

import * as React from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { isSettingsOpenAtom, userAtom } from "@/store/atoms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, CreditCard, Download, RefreshCw } from "lucide-react";
import {
  useSubscriptionStatus,
  usePaymentMethod,
  useInvoices,
} from "@/hooks/useSubscriptionStatus";
import { createPortalSession, buyCreditPack, cancelSubscription, resubscribe } from "@/lib/subscriptionApi";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function SubscriptionContent() {
  const user = useAtomValue(userAtom);
  const setSettingsOpen = useSetAtom(isSettingsOpenAtom);
  const router = useRouter();
  const { toast } = useToast();

  const { data: subscription, isLoading: isSubLoading, refetch: refetchSubscription } = useSubscriptionStatus();
  const isPaid = !!subscription?.active && subscription.plan !== "free";
  const { data: paymentMethod } = usePaymentMethod(isPaid);
  const { data: invoicesData, isLoading: isInvoicesLoading } = useInvoices(1, 10, isPaid);

  const [isPortalLoading, setIsPortalLoading] = React.useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [isResubscribing, setIsResubscribing] = React.useState(false);

  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const cancelAt = subscription?.cancel_at
    ? new Date(subscription.cancel_at * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const plan = subscription?.plan ?? "free";
  const isFree = plan === "free";
  const planDisplayName = plan === "pro" ? "Professional" : plan.charAt(0).toUpperCase() + plan.slice(1);
  const cycleLabel = subscription?.duration === 6 ? "6 months" : "Monthly";

  const baseLimit = subscription?.credits?.limit ?? 250;
  const extra = subscription?.credits?.extra ?? 0;
  const used = subscription?.credits?.used ?? 0;
  const balance = Math.max(0, baseLimit + extra - used);
  const resetAt = subscription?.credits?.resetAt;
  const daysUntilReset = resetAt
    ? Math.max(0, Math.ceil((resetAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const email = user?.email ?? user?.uid ?? user?.profile?.email ?? "";

  async function handlePortal() {
    if (!email || isPortalLoading) return;
    setIsPortalLoading(true);
    try {
      const { url } = await createPortalSession({ email, return_url: window.location.href });
      window.location.href = url;
    } catch {
      toast({ title: "Error", description: "Could not open billing portal.", variant: "destructive" });
    } finally {
      setIsPortalLoading(false);
    }
  }

  async function handleBuyCredits() {
    if (!email || isBuyingCredits) return;
    setIsBuyingCredits(true);
    try {
      const { url } = await buyCreditPack({
        email,
        success_url: `${window.location.origin}/settings?credits_added=true`,
        cancel_url: window.location.href,
      });
      window.location.href = url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not open credits checkout.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsBuyingCredits(false);
    }
  }

  function handleAdjustPlan() {
    setSettingsOpen(false);
    router.push("/upgrade");
  }

  async function handleResubscribe() {
    if (isResubscribing) return;
    setIsResubscribing(true);
    try {
      await resubscribe();
      await refetchSubscription();
      toast({ title: "Subscription reactivated", description: "Your subscription will continue as normal." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not reactivate subscription.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsResubscribing(false);
    }
  }

  async function handleCancel() {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelSubscription();
      await refetchSubscription();
      toast({
        title: "Subscription cancelled",
        description: "You'll keep full access until the end of your billing period.",
      });
      setShowCancelConfirm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not cancel subscription.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  }

  if (isSubLoading) {
    return <div className="py-12 text-center text-sm text-[#9B9B9B]">Loading…</div>;
  }

  return (
    <div className="space-y-7">
      {/* ── Plan header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#444]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#151515]">{planDisplayName} plan</p>
            {!isFree && <p className="text-sm text-[#9B9B9B]">{cycleLabel}</p>}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleAdjustPlan}
          className="shrink-0 h-9 px-4 rounded-xl border-[#ECEDEE] text-sm font-medium hover:bg-gray-50"
        >
          Adjust plan
        </Button>
      </div>

      {/* ── Pending cancellation banner ── */}
      {isPaid && cancelAtPeriodEnd && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#ECEDEE] bg-[#FAFAFA] px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">📅</span>
            <p className="text-sm text-[#151515]">
              Your subscription will be canceled on {cancelAt ?? "the end of your billing period"}.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleResubscribe}
            disabled={isResubscribing}
            className="shrink-0 h-9 px-4 rounded-xl border-[#ECEDEE] text-sm font-medium hover:bg-gray-50"
          >
            {isResubscribing ? "Loading…" : "Resubscribe"}
          </Button>
        </div>
      )}

      <hr className="border-[#F0F0F0]" />

      {/* ── Payment ── */}
      {isPaid && (
        <div>
          <p className="text-[13px] font-semibold text-[#9B9B9B] uppercase tracking-wider mb-3">Payment</p>
          <div className="flex items-center justify-between rounded-xl border border-[#ECEDEE] px-4 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg border border-[#ECEDEE] bg-white flex items-center justify-center shrink-0">
                {paymentMethod?.brand === "visa" ? (
                  <img src="/figmaAssets/visa.svg" alt="Visa" className="w-6" />
                ) : (
                  <CreditCard className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-[#151515] truncate">
                {paymentMethod?.has_payment_method
                  ? `${paymentMethod.brand?.charAt(0).toUpperCase()}${paymentMethod.brand?.slice(1)} **** ${paymentMethod.last4}`
                  : "No payment method on file"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={isPortalLoading}
              className="shrink-0 h-9 px-4 rounded-xl border-[#ECEDEE] text-sm font-medium hover:bg-gray-50"
            >
              {isPortalLoading ? "Loading…" : "Update"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Usage credits ── */}
      <div>
        <p className="text-[13px] font-semibold text-[#9B9B9B] uppercase tracking-wider mb-1">Usage credits</p>
        <p className="text-sm text-[#9B9B9B] mb-4">
          {isFree
            ? "Your one-time free budget. Upgrade anytime for a monthly allowance."
            : "Buy extra credits to keep using Sorene if you hit your monthly limit."}
        </p>

        {/* Balance row — only show number if user has purchased extra credits */}
        <div className="flex items-end justify-between gap-4 mb-4">
          {extra > 0 ? (
            <div>
              <p className="text-2xl font-semibold text-[#151515]">
                {balance.toLocaleString()}
                <span className="text-base font-normal text-[#9B9B9B] ml-1.5">credits</span>
              </p>
              <p className="text-xs text-[#9B9B9B] mt-0.5">Current balance</p>
            </div>
          ) : (
            <div />
          )}

          {isFree ? (
            <Button
              onClick={handleAdjustPlan}
              className="shrink-0 h-9 px-4 rounded-xl bg-[#111111] hover:bg-[#333] text-white text-sm font-medium"
            >
              Upgrade
            </Button>
          ) : (
            <Button
              onClick={handleBuyCredits}
              disabled={isBuyingCredits}
              className="shrink-0 h-9 px-4 rounded-xl bg-[#111111] hover:bg-[#333] text-white text-sm font-medium"
            >
              {isBuyingCredits ? "Loading…" : "Buy more"}
            </Button>
          )}
        </div>

        {/* Auto-reload (paid only) */}
        {!isFree && (
          <>
            <hr className="border-[#F0F0F0] mb-4" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#151515]">Auto-reload</p>
                <p className="text-xs text-[#9B9B9B] mt-0.5">
                  Automatically buy more credits when you&apos;re running low
                </p>
              </div>
              <Button
                variant="outline"
                disabled
                className="shrink-0 h-9 px-4 rounded-xl border-[#ECEDEE] text-sm font-medium text-[#9B9B9B] cursor-not-allowed"
                title="Coming soon"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Turn on
              </Button>
            </div>
            {daysUntilReset !== null && (
              <p className="text-xs text-[#BCBCBC] mt-3">
                Monthly credits reset in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Invoices ── */}
      {isPaid && (
        <>
          <hr className="border-[#F0F0F0]" />
          <div>
            <p className="text-[13px] font-semibold text-[#9B9B9B] uppercase tracking-wider mb-4">Invoices</p>
            <div className="rounded-2xl border border-[#ECEDEE] overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                    {["Date", "Total", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-[#9B9B9B] px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isInvoicesLoading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-sm text-[#9B9B9B]">
                        Loading invoices…
                      </td>
                    </tr>
                  ) : invoicesData?.invoices?.length ? (
                    invoicesData.invoices.map((inv, i) => (
                      <tr key={inv.id ?? i} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                        <td className="text-sm text-[#151515] px-5 py-3.5 whitespace-nowrap">
                          {new Date(inv.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="text-sm font-medium text-[#151515] px-5 py-3.5 whitespace-nowrap">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency || "USD" }).format(inv.amount)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                            inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600",
                          )}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {inv.pdf_url ? (
                            <a
                              href={inv.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-[#151515] font-medium hover:underline"
                            >
                              <Download className="w-3.5 h-3.5" />
                              View
                            </a>
                          ) : (
                            <span className="text-sm text-[#9B9B9B]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-sm text-[#9B9B9B]">
                        No invoices yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Cancel subscription ── */}
      {isPaid && !cancelAtPeriodEnd && (
        <>
          <hr className="border-[#F0F0F0]" />
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-[#9B9B9B] hover:text-red-500 transition-colors"
            >
              Cancel subscription
            </button>
          ) : (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-medium text-[#151515]">Cancel subscription?</p>
              <p className="text-sm text-[#9B9B9B]">
                You&apos;ll keep full access until the end of your current billing period. No refund is issued.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="h-9 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
                >
                  {isCancelling ? "Cancelling…" : "Yes, cancel"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  className="h-9 px-4 rounded-xl border-[#ECEDEE] text-sm font-medium"
                >
                  Keep subscription
                </Button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
