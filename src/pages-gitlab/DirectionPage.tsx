"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { DirectionSection } from "@/components/direction/DirectionSection";
import { DirectionChat } from "@/components/direction/DirectionChat";
import { useSetAtom } from "jotai";
import { recipeDirectionsAtom } from "@/store/atoms";

export function DirectionPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const setRecipeDirections = useSetAtom(recipeDirectionsAtom);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recipeDirections");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setRecipeDirections(parsed);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F9FAFB] relative">
      {/* Left Column: Direction Layout — hidden on mobile when chat is open */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden ${
          chatOpen ? "hidden xl:flex" : "flex"
        }`}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F9FAFB]">
          <div className="max-w-6xl mx-auto">
            <DirectionSection />
          </div>
        </div>
      </div>

      {/* Right Column: Chat Interface — desktop only */}
      <div className="w-112.5 mt-6 shrink-0 hidden xl:block" style={{ height: "calc(100% - 1.5rem)" }}>
        <DirectionChat />
      </div>

      {/* Mobile Chat Panel — slides in from right */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-2 rounded-4xl z-50 xl:hidden overflow-hidden"
          >
            <DirectionChat onClose={() => setChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button — mobile only, hidden when chat is open */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute bottom-6 right-6 z-40 xl:hidden w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
        >
          <MessageCircle size={22} className="text-white" />
        </button>
      )}
    </div>
  );
}
