"use client";

import { Rocket } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F7F7F7] flex items-center justify-center">
          <Rocket size={26} className="text-[#151515]" />
        </div>
        <h1 className="text-2xl font-semibold text-[#151515]">Execution Hub</h1>
        <p className="text-sm text-[#62646A] leading-6">
          Turn your Direction into momentum. Plans, milestones, and execution
          tracking land here soon.
        </p>
        <p className="text-xs text-[#9A9A9A]">Coming soon</p>
      </div>
    </div>
  );
}
