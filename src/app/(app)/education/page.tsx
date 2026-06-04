"use client";

import { Play } from "lucide-react";

const videos = [
  {
    title: "Master the tactical and psychological leap from employee to founder.",
    description: "Coming soon",
  },
  {
    title: "How to validate the right way",
    description: "Coming soon",
  },
  {
    title: "How to create social posts & messages",
    description: "Coming soon",
  },
  {
    title: "How to talk to your customers",
    description: "Coming soon",
  },
];

function VideoPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-full aspect-video bg-[#F7F7F7] rounded-2xl flex items-center justify-center border border-[#E8E8E8]">
        <div className="w-12 h-12 rounded-full bg-[#ECEDEE] flex items-center justify-center">
          <Play size={20} className="text-[#62646A] ml-0.5" />
        </div>
      </div>
      <div>
        <p className="text-[14px] font-medium text-[#151515] leading-5">{title}</p>
        <p className="text-[12px] text-[#9A9A9A] mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex flex-col flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#151515]">Education</h1>
        <p className="text-sm text-[#62646A] mt-1 leading-6">
          Learn the skills and mindset to make your entrepreneurial leap.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {videos.map((video) => (
          <VideoPlaceholder key={video.title} title={video.title} description={video.description} />
        ))}
      </div>
    </div>
  );
}
