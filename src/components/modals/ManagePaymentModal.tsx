"use client";

import * as React from "react";
import { useAtom } from "jotai";
import { isManagePaymentOpenAtom } from "@/store/atoms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

export function ManagePaymentModal() {
  const [isOpen, setIsOpen] = useAtom(isManagePaymentOpenAtom);

  const [formData, setFormData] = React.useState({
    cardNumber: "4444-3333-2222-1111",
    expiry: "MM/YY",
    cvv: "XXX",
    cardholderName: "Jhon Walker",
    country: "United Kingdom",
    address: "10 Downing Street",
    city: "London",
    postalCode: "SW1A 2AA",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Payment method updated:", formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[450px] p-6 rounded-2xl"
      >
        <DialogHeader className="text-left pb-2">
          <DialogTitle className="text-lg font-medium text-[#151515]">
            Manage Payment Method
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#151515]">
              Card Number
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                className="pl-10 h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
                placeholder="0000 0000 0000 0000"
              />
            </div>
          </div>

          {/* MM/YY and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#151515]">
                MM/YY
              </Label>
              <Input
                name="expiry"
                value={formData.expiry}
                onChange={handleChange}
                className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
                placeholder="MM/YY"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#151515]">CVV</Label>
              <Input
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
                placeholder="XXX"
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#151515]">
              Cardholder name
            </Label>
            <Input
              name="cardholderName"
              value={formData.cardholderName}
              onChange={handleChange}
              className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
              placeholder="Name on card"
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#151515]">
              Country
            </Label>
            <Input
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
              placeholder="Country"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#151515]">
              Address
            </Label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
              placeholder="Billing address"
            />
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#151515]">City</Label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#151515]">
                Postal Code
              </Label>
              <Input
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-gray-300 text-[#151515]"
                placeholder="Postal code"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="h-10 px-5 rounded-lg border-gray-200 text-[#151515] hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 px-5 rounded-lg bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
