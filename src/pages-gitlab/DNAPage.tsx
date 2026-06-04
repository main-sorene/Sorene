"use client";

import { useState, useEffect } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { DNAChat } from "@/components/dna/DNAChat";
import { DNAReveal } from "@/components/dna/DNAReveal";

export function DNAPage({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("dna-revealed");
    if (!seen) setRevealing(true);
  }, []);

  const handleRevealComplete = () => {
    setRevealing(false);
    sessionStorage.setItem("dna-revealed", "1");
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F9FAFB] relative">
      {/* Reveal overlay — shown once per session */}
      <AnimatePresence>
        {revealing && <DNAReveal onComplete={handleRevealComplete} />}
      </AnimatePresence>

      {/* Left Column: DNA Grid — hidden on mobile when chat is open */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden ${
          chatOpen ? "hidden xl:flex" : "flex"
        }`}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F9FAFB]">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Right Column: Chat Interface — desktop only */}
      <div className="w-112.5 h-full shrink-0 hidden xl:block">
        <DNAChat />
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
            <DNAChat onClose={() => setChatOpen(false)} />
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
