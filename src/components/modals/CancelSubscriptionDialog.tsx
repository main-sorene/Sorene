"use client";

import * as React from "react";
import { useAtom } from "jotai";
import { isCancelSubscriptionOpenAtom } from "@/store/atoms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function CancelSubscriptionDialog() {
  const [isOpen, setIsOpen] = useAtom(isCancelSubscriptionOpenAtom);

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleConfirmCancel = () => {
    // Handle subscription cancellation logic here
    console.log("Subscription cancelled");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[400px] p-6 rounded-2xl"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-medium text-[#151515]">
            Cancel Subscription?
          </DialogTitle>
          <p className="text-sm text-[#62646A] mt-2 leading-relaxed">
            This will stop your current plan and remove access to premium
            features after your billing
          </p>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-10 px-5 rounded-lg border-gray-200 text-[#151515] hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmCancel}
            className="h-10 px-4 rounded-xl text-[#DF2E16] border border-[#ECEDEE] text-sm font-medium shadow-sm"
          >
            Cancel Subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
