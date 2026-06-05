"use client";

import { Play } from "lucide-react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/store/atoms";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden border border-[#ECEDEE] flex flex-col"
    >
      {/* Thumbnail placeholder */}
      <div className="w-full aspect-video bg-[#F7F7F7] flex items-center justify-center relative">
        <div className="w-12 h-12 rounded-full bg-white/80 border border-[#ECEDEE] flex items-center justify-center shadow-sm">
          <Play size={18} className="text-[#151515] ml-0.5" fill="#151515" />
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
          Coming soon
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4">
        <p className="text-[14px] font-semibold text-[#151515] leading-[1.45]">
          {title}
        </p>
      </div>
    </motion.div>
  );
}

export default function Page() {
  const authUser = useAtomValue(userAtom);

  const avatarUrl =
    authUser?.profile?.photoUrl ||
    authUser?.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.displayName || "User"}`;

  const displayName = authUser?.profile
    ? `${authUser.profile.firstName} ${authUser.profile.lastName}`
    : authUser?.displayName || "User";

  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB] overflow-y-auto no-scrollbar">
      <div className="max-w-6xl mx-auto w-full p-3 lg:py-6 lg:px-3 pb-24">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6 px-1">
          <div>
            <h1 className="text-[22px] font-semibold text-[#151515] leading-snug">
              Education
            </h1>
            <p className="text-sm text-[#62646A] mt-1 leading-relaxed">
              Learn the skills and mindset to make your entrepreneurial leap.
            </p>
          </div>

          <div className="flex items-center gap-3 ml-4 mt-0.5 shrink-0">
            <a
              href="https://discord.gg/2YtvCm2SWp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151515] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              Product Feedback
            </a>
            {/* Profile picture */}
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full shrink-0 bg-purple-100 border border-[#ECEDEE]"
            />
          </div>
        </div>

        {/* Video grid */}
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
  );
}
