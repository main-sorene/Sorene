"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { userAtom } from "@/store/atoms";
import { useToast } from "@/hooks/use-toast";
import {
  createCheckoutSession,
  syncSubscription,
} from "@/lib/subscriptionApi";
import {
  useRefetchSubscriptionStatus,
  useSubscriptionStatus,
} from "@/hooks/useSubscriptionStatus";
import { UpgradeConfirmModal } from "@/components/modals/UpgradeConfirmModal";

import { plans, PLAN_WEIGHTS, type Plan } from "@/lib/plans";

export function UpgradePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semiAnnual">(
    "monthly",
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const searchParams = useSearchParams();
  const user = useAtomValue(userAtom);
  const refetchSubscriptionStatus = useRefetchSubscriptionStatus();
  const { data: subscription } = useSubscriptionStatus();

  const currentPlanId = subscription?.plan || "free";
  const highlightedPlan = searchParams.get("plan");

  useEffect(() => {
    if (searchParams.get("checkout_success") !== "true") return;

    toast({
      title: "Payment successful!",
      description: "Your subscription is being activated…",
    });

    // Sync subscription from Stripe directly — guaranteed fallback in case
    // the webhook was delayed or failed. Retry up to 3 times (Stripe may need
    // a moment to finalize the subscription after redirect).
    const run = async () => {
      let synced = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));
        try {
          const result = await syncSubscription();
          if (result.synced) { synced = true; break; }
        } catch { /* non-fatal */ }
      }
      refetchSubscriptionStatus();
      if (synced) {
        toast({ title: "Subscription activated!", description: "Welcome to your new plan." });
      }
      const t = setTimeout(() => refetchSubscriptionStatus(), 5000);
      return () => clearTimeout(t);
    };
    run();
  }, []);

  useEffect(() => {
    if (!highlightedPlan) return;
    const el = document.getElementById(`plan-card-${highlightedPlan}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedPlan]);

  async function handleUpgrade(plan: Plan, isCurrent: boolean) {
    if (isCurrent || loadingPlan) return;
    const email = user?.email ?? user?.uid ?? user?.profile?.email;
    if (!email) {
      toast({ title: "Error", description: "User email not found. Please log in again.", variant: "destructive" });
      return;
    }

    const hasActiveSubscription = subscription?.active && subscription?.plan !== "free";

    if (hasActiveSubscription) {
      // Show confirmation modal with promo code option
      setConfirmPlan(plan);
      return;
    }

    setLoadingPlan(plan.name);
    try {
      const result = await createCheckoutSession({
        cancel_url: `${window.location.origin}/upgrade`,
        success_url: `${window.location.origin}/upgrade?checkout_success=true`,
        duration: billingCycle === "monthly" ? 1 : 6,
        email,
        plan: plan.id,
      });
      window.location.href = result.url;
    } catch (err) {
      console.error(err);
      toast({
        title: "Checkout failed",
        description: "There was an error starting checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  }

  const confirmPlanPrice = confirmPlan
    ? billingCycle === "monthly"
      ? confirmPlan.id === "pro" ? "$49 / mo" : "$15 / mo"
      : confirmPlan.id === "pro" ? "$245 / 6 mo" : "$75 / 6 mo"
    : "";

  return (
    <>
    {confirmPlan && (
      <UpgradeConfirmModal
        open={!!confirmPlan}
        onClose={() => setConfirmPlan(null)}
        onSuccess={() => { refetchSubscriptionStatus(); setTimeout(refetchSubscriptionStatus, 3000); }}
        plan={confirmPlan.id}
        planDisplayName={confirmPlan.name}
        price={confirmPlanPrice}
        duration={billingCycle === "monthly" ? 1 : 6}
      />
    )}
    <div className="min-h-screen bg-white relative overflow-y-auto px-4 pt-14 pb-8 md:pt-10 md:pb-10">
      {/* Close button — offset so it never overlaps the heading */}
      <button
        type="button"
        onClick={() => router.push("/chat")}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F0F0F0] transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-[#62646A]" />
      </button>

      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12 px-2 md:px-0">
        <h1 className="text-[4.8vw] sm:text-2xl md:text-5xl font-medium text-[#1A1A1A] mb-4 leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
          Upgrade your plan for more features
        </h1>
        <p className="text-[#62646A] text-base md:text-base mb-8">
          Choose the perfect plan to create, innovate,{" "}
          <br />
          and accelerate your workflow.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center bg-[#F7F7F7] p-1 rounded-lg border border-gray-100">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm transition-all",
              billingCycle === "monthly"
                ? "bg-white shadow-sm text-black"
                : "text-[#62646A] hover:text-black",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("semiAnnual")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm transition-all text-center",
              billingCycle === "semiAnnual"
                ? "bg-white shadow-sm text-black"
                : "text-[#62646A] hover:text-black",
            )}
          >
            6 months (30% off)
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const currentDuration = subscription?.duration || 1;
          const uiDuration = billingCycle === "monthly" ? 1 : 6;
          const isCurrent =
            !!subscription?.active &&
            currentPlanId === plan.id &&
            (plan.id === "free" || currentDuration === uiDuration);

          const currentWeight = PLAN_WEIGHTS[currentPlanId] ?? 0;
          const cardWeight = PLAN_WEIGHTS[plan.id] ?? 0;

          let buttonText = "Upgrade";
          if (isCurrent) {
            buttonText = "Current plan";
          } else if (plan.id === "free") {
            buttonText = "Downgrade";
          } else if (cardWeight < currentWeight) {
            buttonText = "Downgrade";
          } else if (cardWeight > currentWeight) {
            buttonText = "Upgrade";
          } else {
            buttonText = uiDuration > currentDuration ? "Switch to 6 months" : "Switch to monthly";
          }

          return (
            <div
              key={plan.name}
              id={`plan-card-${plan.id}`}
              className={cn(
                "relative bg-white border rounded-[24px] p-5 flex flex-col transition-all",
                highlightedPlan === plan.id
                  ? "border-[#FDC24C] ring-2 ring-[#FDC24C]"
                  : "border-[#ECEDEE]",
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-4 right-4">
                  <div className="bg-[#FFF1C6] text-[#F99207] px-3 py-1 rounded-lg text-[12px] font-semibold border border-[#FFE7A8]">
                    Most popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-base font-medium text-black mb-4">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-medium  text-black">
                    $
                    {billingCycle === "monthly"
                      ? plan.price.monthly
                      : plan.price.semiAnnual}
                  </span>
                  <span className="text-gray-400 text-[13px]">/month</span>
                </div>
                <p className="text-[#62646A] text-sm leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <Button
                className={cn(
                  "w-full h-10 rounded-lg mb-8 transition-all",
                  isCurrent
                    ? "bg-[#C4C4C4] hover:bg-[#B0B0B0] text-white cursor-default"
                    : "bg-black hover:bg-black/90 text-white",
                )}
                disabled={isCurrent || loadingPlan === plan.name}
                onClick={() => handleUpgrade(plan, isCurrent)}
              >
                {loadingPlan === plan.name ? "Loading..." : buttonText}
              </Button>

              <div className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span
                      className={cn("text-sm text-[#62646A] leading-relaxed")}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
