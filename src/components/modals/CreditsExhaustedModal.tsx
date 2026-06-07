"use client";

import { useAtom } from "jotai";
import { isCreditsExhaustedOpenAtom } from "@/store/atoms";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export function CreditsExhaustedModal() {
  const [isOpen, setIsOpen] = useAtom(isCreditsExhaustedOpenAtom);
  const { data: subscription } = useSubscriptionStatus();

  const isPaidPlan = subscription?.active && subscription.plan !== "free";
  const isProPlan = subscription?.plan === "pro";

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
        {/* Top accent */}
        <div className="w-full h-1.5 bg-[#FDC24C]" />

        <div className="p-6 space-y-5">
          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFF8E6] flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#FDC24C]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#151515]">
                You&apos;ve used all your credits
              </h2>
              <p className="text-sm text-[#62646A] mt-1 leading-relaxed">
                {isPaidPlan
                  ? isProPlan
                    ? "You've used all your monthly credits. Buy more to keep going, or wait for your monthly reset."
                    : "You've used all your monthly credits. Buy more credits or upgrade to Professional for 5,000 credits/month."
                  : "Upgrade to keep using Sorene — unlock more AI conversations, direction refinements, and DNA updates."}
              </p>
            </div>
          </div>

          {/* Options for free users: plan comparison */}
          {!isPaidPlan && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#ECEDEE] bg-[#FAFAFA]">
                <div>
                  <p className="text-sm font-medium text-[#151515]">Starter</p>
                  <p className="text-xs text-[#62646A]">1,500 credits / month</p>
                </div>
                <p className="text-sm font-semibold text-[#151515]">$15 / mo</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#FDC24C] bg-[#FFFBF0]">
                <div>
                  <p className="text-sm font-medium text-[#151515]">
                    Professional
                    <span className="ml-2 text-xs text-[#F99207] font-semibold bg-[#FFF1C6] px-2 py-0.5 rounded-full">
                      Most popular
                    </span>
                  </p>
                  <p className="text-xs text-[#62646A]">5,000 credits / month</p>
                </div>
                <p className="text-sm font-semibold text-[#151515]">$49 / mo</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleUpgrade}
              className="w-full h-11 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium"
            >
              {isPaidPlan && !isProPlan ? "Upgrade to Professional" : "See upgrade plans"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="w-full h-11 rounded-xl text-[#62646A] text-sm"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
