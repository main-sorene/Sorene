"use client";

import { Provider } from "jotai";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthPersistence } from "@/components/auth/AuthPersistence";
import { CookieBanner } from "@/components/modals/CookieBanner";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AuthPersistence>
            <AnalyticsProvider>
              {children}
            </AnalyticsProvider>
          </AuthPersistence>
          <CookieBanner />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}
