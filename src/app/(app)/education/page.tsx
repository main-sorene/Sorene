"use client";

import { useState } from "react";
import { Play, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EducationChat } from "@/components/education/EducationChat";

const videos = [
  {
    id: 1,
    title: "Master the tactical and psychological leap from employee to founder.",
  },
  {
    id: 2,
    title: "How to validate the right way",
  },
  {
    id: 3,
    title: "How to create social posts & messages",
  },
  {
    id: 4,
    title: "How to talk to your customers",
  },
];

function VideoCard({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-[#ECEDEE] flex flex-col">
      <div className="w-full aspect-video bg-[#F7F7F7] flex items-center justify-center relative">
        <div className="w-12 h-12 rounded-full bg-white/80 border border-[#ECEDEE] flex items-center justify-center shadow-sm">
          <Play size={18} className="text-[#151515] ml-0.5" fill="#151515" />
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
          Coming soon
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-[14px] font-semibold text-[#151515] leading-[1.45]">{title}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F9FAFB] relative">
      {/* Left column — hidden on mobile when chat is open */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${chatOpen ? "hidden xl:flex" : "flex"}`}>
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F9FAFB]">
          <div className="max-w-6xl mx-auto p-3 lg:py-6 lg:px-3 pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <VideoCard title={video.title} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right column — desktop chat panel */}
      <div className="w-112.5 h-full shrink-0 hidden xl:block">
        <EducationChat />
      </div>

      {/* Mobile chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-2 rounded-4xl z-50 xl:hidden overflow-hidden"
          >
            <EducationChat onClose={() => setChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chat button — mobile only */}
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
