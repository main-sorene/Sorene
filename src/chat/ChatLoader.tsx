"use client";

import { motion } from "framer-motion";

export function ChatLoader() {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-3xl mx-auto px-4 py-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} w-full`}
        >
          <div
            className={`flex gap-3 max-w-[80%] ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
          >
            {/* Avatar skeleton */}
            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0 animate-pulse" />

            <div
              className={`flex flex-col gap-2 ${i % 2 === 0 ? "items-start" : "items-end"}`}
            >
              {/* Message skeleton */}
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
                className={`h-4 rounded-full bg-gray-100 ${i === 1 ? "w-48" : i === 2 ? "w-64" : "w-32"}`}
              />
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
                className={`h-4 rounded-full bg-gray-50 ${i === 1 ? "w-32" : i === 2 ? "w-40" : "w-24"}`}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Premium Gradient Spinner */}
      <div className="flex justify-center pt-8">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#8A38F5] border-r-[#8A38F5]/30"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8A38F5] animate-ping" />
          </div>
        </div>
      </div>
    </div>
  );
}
