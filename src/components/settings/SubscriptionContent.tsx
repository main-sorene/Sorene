"use client";

import * as React from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  isCancelSubscriptionOpenAtom,
  isManagePaymentOpenAtom,
  userAtom,
} from "@/store/atoms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Download, CreditCard, FileText } from "lucide-react";
import {
  useSubscriptionStatus,
  usePaymentMethod,
  useInvoices,
} from "@/hooks/useSubscriptionStatus";
import { createPortalSession } from "@/lib/subscriptionApi";
import Link from "next/link";
import { plans } from "@/lib/plans";

export function SubscriptionContent() {
  const [, setCancelOpen] = useAtom(isCancelSubscriptionOpenAtom);
  const [, setManagePaymentOpen] = useAtom(isManagePaymentOpenAtom);
  const user = useAtomValue(userAtom);
  const { data: subscription, isLoading: isSubLoading } =
    useSubscriptionStatus();
  const { data: paymentMethod, isLoading: isPMLoading } = usePaymentMethod(
    !!subscription?.active,
  );
  const { data: invoicesData, isLoading: isInvoicesLoading } = useInvoices(
    1,
    10,
    !!subscription?.active,
  );
  const [isPortalLoading, setIsPortalLoading] = React.useState(false);

  const planName = subscription?.plan || "Free";
  const currentPlan =
    plans.find((p) => p.id === subscription?.plan) || plans[0];
  const features = currentPlan.features;

  const isSemiAnnual = subscription?.duration === 6;
  const planPrice =
    planName === "starter"
      ? isSemiAnnual
        ? 12.5
        : 15
      : planName === "pro"
        ? isSemiAnnual
          ? 34.33
          : 49
        : 0;
  const planDuration = isSemiAnnual ? "/month (billed 6 months)" : "/month";

  async function handleManagePortal() {
    const email = user?.email ?? user?.profile?.email;
    if (!email || isPortalLoading) return;

    setIsPortalLoading(true);
    try {
      const result = await createPortalSession({
        email,
        return_url: window.location.href,
      });
      window.location.href = result.url;
    } catch (err) {
      console.error("Failed to create portal session:", err);
    } finally {
      setIsPortalLoading(false);
    }
  }

  if (isSubLoading)
    return <div className="p-8 text-center">Loading subscription...</div>;

  return (
    <div className="space-y-8">
      {/* Subscriptions Header */}
      <div>
        <h3 className="text-lg font-medium text-[#151515] mb-6">
          Subscriptions
        </h3>

        {/* Plan Card */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-2xl font-medium text-[#151515] capitalize">
                {planName}
              </h4>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-medium text-[#151515]">
                  ${planPrice}
                </span>
                <span className="text-sm text-[#62646A]">{planDuration}</span>
              </div>
              {subscription?.active && (
                <p className="text-sm text-[#62646A] mt-1">
                  Status:{" "}
                  <span className="text-[#151515] font-medium capitalize">
                    {subscription.status}
                  </span>
                </p>
              )}
            </div>
            <span className="px-3 py-2 text-sm font-medium text-[#F99207] bg-[#FFF1C6] rounded-lg">
              {subscription?.active ? "Active plan" : "Current plan"}
            </span>
          </div>

          {/* Features */}
          <div className="space-y-2 pt-2">
            {features.slice(0, 5).map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-[#62646A]"
              >
                {feature.includes("plus:") ? (
                  <span className="text-[#62646A] py-1">{feature}</span>
                ) : (
                  <>
                    <Check size={16} className="text-[#62646A]" />
                    <span>{feature}</span>
                  </>
                )}
              </div>
            ))}
            {features.length > 5 && (
              <p className="text-sm text-[#151515] font-medium pt-1">
                and more...
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {subscription?.plan === "free" ? (
              <Link href="/upgrade">
                <Button className="h-10 px-4 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium">
                  Upgrade plan
                </Button>
              </Link>
            ) : (
              <Button
                onClick={handleManagePortal}
                disabled={isPortalLoading}
                className="h-10 px-4 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium"
              >
                {isPortalLoading ? "Loading..." : "Manage plan"}
              </Button>
            )}
            {subscription?.active && subscription?.plan !== "free" && (
              <Button
                variant="ghost"
                onClick={() => setCancelOpen(true)}
                className="h-10 px-4 rounded-xl text-[#DF2E16] border border-[#ECEDEE] text-sm font-medium shadow-sm"
              >
                Cancel subscription
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {subscription?.active && (
        <div>
          <h3 className="text-lg font-medium text-[#151515] mb-4">
            Payment Method
          </h3>
          <div className="flex items-center justify-between p-4 border border-[#ECEDEE] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded border border-[#ECEDEE] flex items-center justify-center">
                {paymentMethod?.brand === "visa" ? (
                  <img src="/figmaAssets/visa.svg" alt="Visa" />
                ) : (
                  <CreditCard className="text-gray-400" />
                )}
              </div>
              <div>
                {paymentMethod?.has_payment_method ? (
                  <>
                    <p className="text-sm font-medium text-[#101828] capitalize">
                      {paymentMethod.brand} **** {paymentMethod.last4}
                    </p>
                    <p className="text-xs text-gray-500">
                      Expiry {paymentMethod.exp_month}/
                      {paymentMethod.exp_year.toString().slice(-2)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    No payment method on file
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleManagePortal}
              disabled={isPortalLoading}
              className="h-9 px-4 rounded-xl border-[#ECEDEE] text-sm font-medium hover:bg-gray-50"
            >
              {isPortalLoading ? "Loading..." : "Manage"}
            </Button>
          </div>
        </div>
      )}

      {/* Invoices */}
      {subscription?.active && (
        <div>
          <h3 className="text-lg font-medium text-[#151515] mb-4">Invoices</h3>
          <div className="border border-[#ECEDEE] rounded-2xl overflow-hidden overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left text-xs font-medium text-[#62646A] px-6 py-4">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-[#62646A] px-6 py-4">
                      Plan
                    </th>
                    <th className="text-left text-xs font-medium text-[#62646A] px-6 py-4">
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium text-[#62646A] px-6 py-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-[#62646A] px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isInvoicesLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoicesData?.invoices?.length ? (
                    invoicesData.invoices.map((invoice, index) => (
                      <tr
                        key={invoice.id || index}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="text-sm font-medium text-[#151515] px-6 py-4 whitespace-nowrap">
                          {new Date(invoice.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="text-sm text-[#62646A] px-6 py-4 max-w-[200px] truncate">
                          {invoice.plan}
                        </td>
                        <td className="text-sm font-medium text-[#151515] px-6 py-4 whitespace-nowrap">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: invoice.currency || "USD",
                          }).format(invoice.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                              invoice.status === "paid"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-700",
                            )}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[#111111] font-medium hover:text-black transition-colors"
                          >
                            <Download size={14} />
                            PDF
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-500 font-medium"
                      >
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
