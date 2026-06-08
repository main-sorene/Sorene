"use client";

import { useAtom } from "jotai";
import { isCreditsExhaustedOpenAtom } from "@/store/atoms";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { PLAN_CREDITS } from "@/lib/credits";

export function CreditsExhaustedModal() {
  const [isOpen, setIsOpen] = useAtom(isCreditsExhaustedOpenAtom);
  const { data: subscription } = useSubscriptionStatus();

  const plan = subscription?.plan ?? "free";
  const isPaidPlan = subscription?.active && plan !== "free";
  const isProPlan = plan === "pro";
  const isStarterPlan = plan === "starter";

  const used = subscription?.credits?.used ?? 0;
  const limit = (subscription?.credits?.limit ?? PLAN_CREDITS.free) + (subscription?.credits?.extra ?? 0);

  const starterCredits = PLAN_CREDITS.starter.toLocaleString();
  const proCredits = PLAN_CREDITS.pro.toLocaleString();
  const freeCredits = PLAN_CREDITS.free.toLocaleString();

  const handleUpgrade = () => {
    setIsOpen(false);
    window.location.href = "https://www.sorene.ai/upgrade";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[400px] p-0 rounded-2xl overflow-hidden"
      >
        <div className="w-full h-1.5 bg-[#FDC24C]" />

        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFF8E6] flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#FDC24C]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#151515]">
                You&apos;ve used all your credits
              </h2>
              <p className="text-sm text-[#62646A] mt-1 leading-relaxed">
                {isProPlan
                  ? `You've used all ${limit.toLocaleString()} of your monthly credits. Wait for your monthly reset or contact support.`
                  : isStarterPlan
                  ? `You've used all ${limit.toLocaleString()} of your monthly credits. Upgrade to Professional for ${proCredits} credits/month.`
                  : `You've used all ${limit.toLocaleString()} of your free credits. Upgrade to keep using Sorene.`}
              </p>
            </div>
          </div>

          {/* Plan comparison — shown for free and starter users */}
          {!isProPlan && (
            <div className="space-y-2">
              {!isPaidPlan && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#ECEDEE] bg-[#FAFAFA]">
                  <div>
                    <p className="text-sm font-medium text-[#151515]">Starter</p>
                    <p className="text-xs text-[#62646A]">{starterCredits} credits / month</p>
                  </div>
                  <p className="text-sm font-semibold text-[#151515]">$15 / mo</p>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#FDC24C] bg-[#FFFBF0]">
                <div>
                  <p className="text-sm font-medium text-[#151515]">
                    Professional
                    <span className="ml-2 text-xs text-[#F99207] font-semibold bg-[#FFF1C6] px-2 py-0.5 rounded-full">
                      Most popular
                    </span>
                  </p>
                  <p className="text-xs text-[#62646A]">{proCredits} credits / month</p>
                </div>
                <p className="text-sm font-semibold text-[#151515]">$49 / mo</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!isProPlan && (
              <Button
                onClick={handleUpgrade}
                className="w-full h-11 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium"
              >
                {isStarterPlan ? "Upgrade to Professional" : "See upgrade plans"}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="w-full h-11 rounded-xl text-[#62646A] text-sm"
            >
              {isProPlan ? "OK, I'll wait for reset" : "Maybe later"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
