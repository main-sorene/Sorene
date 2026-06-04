"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DNARevealProps {
  onComplete: () => void;
}

export function DNAReveal({ onComplete }: DNARevealProps) {
  const [phase, setPhase] = useState<"building" | "ready" | "exit">("building");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ready"), 1400);
    const t2 = setTimeout(() => setPhase("exit"), 2600);
    const t3 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "radial-gradient(125.79% 132.57% at 50% 0%, #000 28.72%, rgba(0,0,0,0) 100%), linear-gradient(180deg, #16B364 0%, #052e16 100%)",
      }}
      animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* DNA icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8"
      >
        <img src="/figmaAssets/dna.svg" className="w-14 h-14 invert brightness-0 opacity-90" alt="" />
      </motion.div>

      {/* Phase text */}
      <div className="relative h-20 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "building" && (
            <motion.div
              key="building"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-white/60 text-lg font-medium tracking-wide">
                Building your DNA
                <Dots />
              </p>
            </motion.div>
          )}
          {phase === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-white text-3xl font-semibold tracking-tight leading-tight">
                Your DNA is ready.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-[3px] bg-white/30 rounded-full"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.8, ease: "linear" }}
      />
    </motion.div>
  );
}

function Dots() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCount((c) => (c + 1) % 4), 420);
    return () => clearInterval(t);
  }, []);
  return <span className="inline-block w-6 text-left">{".".repeat(count)}</span>;
}
