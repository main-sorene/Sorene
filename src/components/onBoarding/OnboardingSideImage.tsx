"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export const OnboardingSideImage = () => {
  const text = "Accompany me on my next business idea";
  const [displayText, setDisplayText] = useState("");

  const typingSpeed = 50;
  const deletingSpeed = 30;
  const pauseDuration = 2000;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    // Continuous loop for typing/deleting:
    let isDeleting = false;
    let charIndex = 0;

    const type = () => {
      const currentFullText = text;

      if (!isDeleting) {
        setDisplayText(currentFullText.slice(0, charIndex + 1));
        charIndex++;

        if (charIndex === currentFullText.length) {
          isDeleting = true;
          timeout = setTimeout(type, pauseDuration);
        } else {
          timeout = setTimeout(type, typingSpeed);
        }
      } else {
        setDisplayText(currentFullText.slice(0, charIndex - 1));
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          timeout = setTimeout(type, pauseDuration / 2);
        } else {
          timeout = setTimeout(type, deletingSpeed);
        }
      }
    };

    timeout = setTimeout(type, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <div className="hidden lg:flex lg:w-1/2 h-screen relative items-center justify-center overflow-hidden">
      {/* Background Image */}
      <img
        src="/figmaAssets/auth-img.png"
        alt="Auth Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col justify-evenly gap-12 w-full max-w-2xl px-8 text-center h-full">
        {/* Animated Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full bg-[#F4F1EC]/70 backdrop-blur-md border border-white/30 rounded-3xl px-6 py-4 flex items-center justify-between gap-4 shadow-lg shadow-yellow-200/20"
        >
          <div className="flex-1 text-left text-[#101010] font-medium text-lg whitespace-nowrap overflow-hidden">
            {displayText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="inline-block w-[2px] h-5 bg-[#101010] ml-1 align-middle"
            />
          </div>
          <div className="w-10 h-10 bg-[#101010] rounded-full flex items-center justify-center text-white shrink-0">
            <ArrowUp size={20} />
          </div>
        </motion.div>

        {/* Static Bottom Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <h2 className="text-4xl sm:text-5xl font-light text-white tracking-tight leading-tight">
            Your creations are waiting
          </h2>
        </motion.div>
      </div>

      {/* Optional: Subtle grid or texture could be added here if needed to match figma exactly */}
    </div>
  );
};
