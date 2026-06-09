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

  const plan = subscription?.plan ?? "free";
  const isPaidPlan = subscription?.active && plan !== "free";
  const isProPlan = plan === "pro";
  const isStarterPlan = plan === "starter";

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
                You&apos;ve reached your usage limit
              </h2>
              <p className="text-sm text-[#62646A] mt-1 leading-relaxed">
                {isProPlan
                  ? "You've reached your monthly limit. Your usage will reset at the start of your next billing cycle."
                  : isStarterPlan
                  ? "You've reached your monthly limit. Upgrade to Professional for more usage."
                  : "You've reached your free usage limit. Upgrade to keep using Sorene."}
              </p>
            </div>
          </div>

          {/* Plan options — free and starter only */}
          {!isProPlan && (
            <div className="space-y-2">
              {!isPaidPlan && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#ECEDEE] bg-[#FAFAFA]">
                  <p className="text-sm font-medium text-[#151515]">Starter</p>
                  <p className="text-sm font-semibold text-[#151515]">$15 / mo</p>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#FDC24C] bg-[#FFFBF0]">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#151515]">Professional</p>
                  <span className="text-xs text-[#F99207] font-semibold bg-[#FFF1C6] px-2 py-0.5 rounded-full">
                    Most popular
                  </span>
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
