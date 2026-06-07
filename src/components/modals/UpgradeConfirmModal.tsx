"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { upgradeSubscription } from "@/lib/subscriptionApi";
import { useToast } from "@/hooks/use-toast";
import { Tag } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: string;
  planDisplayName: string;
  price: string;
  duration: number;
}

export function UpgradeConfirmModal({ open, onClose, onSuccess, plan, planDisplayName, price, duration }: Props) {
  const { toast } = useToast();
  const [promoCode, setPromoCode] = React.useState("");
  const [showPromo, setShowPromo] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleConfirm() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await upgradeSubscription({
        plan,
        duration,
        prorate: true,
        promotionCode: promoCode.trim() || undefined,
      });
      toast({ title: "Plan upgraded!", description: `You're now on the ${planDisplayName} plan.` });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upgrade failed. Please try again.";
      toast({ title: "Upgrade failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] p-0 rounded-2xl overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-[#151515]">Confirm upgrade</h2>
            <p className="text-sm text-[#62646A] mt-1">
              Switch to <strong>{planDisplayName}</strong> — {duration === 1 ? "billed monthly" : "billed every 6 months"}.
              You&apos;ll be charged the prorated difference immediately.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFA] border border-[#ECEDEE]">
            <div>
              <p className="text-sm font-semibold text-[#151515]">{planDisplayName}</p>
              <p className="text-xs text-[#9B9B9B]">{duration === 1 ? "Monthly" : "6-month"} billing</p>
            </div>
            <p className="text-sm font-semibold text-[#151515]">{price}</p>
          </div>

          {/* Promo code */}
          {!showPromo ? (
            <button
              onClick={() => setShowPromo(true)}
              className="flex items-center gap-1.5 text-sm text-[#9B9B9B] hover:text-[#151515] transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              Have a promo code?
            </button>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9B9B9B] uppercase tracking-wider">Promo code</label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="w-full h-10 px-3 rounded-xl border border-[#ECEDEE] text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                autoFocus
              />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium"
            >
              {isLoading ? "Upgrading…" : "Confirm upgrade"}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-[#62646A] text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
