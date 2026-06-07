"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "sorene_cookie_consent";

export function CookieBanner() {
  const pathname = usePathname();
  // Start hidden so the server HTML and the first client render match exactly.
  // Reading localStorage during render caused a hydration mismatch that broke
  // interactivity on every page (no event handlers attached). Decide visibility
  // in an effect, which only runs on the client after hydration.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "accepted");
    } catch {
      setVisible(true);
    }
  }, []);

  // Don't render on legal pages so the user can read them without the banner overlapping
  const isLegalPage = /^\/(privacy|terms)/.test(pathname || "");
  if (isLegalPage) return null;

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // storage unavailable — still dismiss for this session
    }
    setVisible(false);
  };

  const handleDecline = () => {
    // No persistence on decline — banner reappears on next page load
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 z-40 left-1/2 -translate-x-1/2 w-[min(320px,calc(100vw-3rem))] md:w-auto md:max-w-[min(760px,calc(100vw-3rem))]"
        >
          <div className="bg-white border border-[#ECEDEE] rounded-2xl shadow-2xl p-5 space-y-4 md:space-y-0 md:flex md:items-center md:gap-6">
            {/* Left: icon + title + body stacked */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center shrink-0">
                  <Cookie size={16} className="text-[#151515]" />
                </div>
                <h3 className="text-sm font-semibold text-[#151515]">
                  Our website uses cookies
                </h3>
              </div>
              <p className="text-xs text-[#62646A] leading-relaxed md:line-clamp-2">
                We use cookies to enhance your browsing experience, analyze site
                traffic, and personalize content. You can accept all cookies or
                manage your preferences. For more details, see our{" "}
                <a
                  href="/privacy-policy"
                  className="text-[#151515] font-medium underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            {/* Right: buttons stacked on desktop, side-by-side on mobile */}
            <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-2 md:shrink-0">
              <Button
                onClick={handleAccept}
                className="flex-1 md:flex-none h-9 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium md:px-5"
              >
                Accept Cookies
              </Button>
              <Button
                variant="outline"
                onClick={handleDecline}
                className="flex-1 md:flex-none h-9 rounded-xl border-[#ECEDEE] text-[#151515] text-xs font-medium hover:bg-gray-50 md:px-5"
              >
                Decline
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
