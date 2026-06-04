"use client";

import { useEffect } from "react";
import { RefreshCw, ArrowLeft } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real error in the console for diagnosis
    console.error("[app/error] route render failed:", error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#F9FAFB] p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="w-10 h-10 rounded-full border-2 border-[#DF2E16] flex items-center justify-center">
          <span className="text-[#DF2E16] text-xl font-semibold">!</span>
        </div>
        <h2 className="text-[18px] font-medium text-[#151515]">Something went wrong</h2>
        <p className="text-[14px] text-[#9CA3AF] leading-relaxed">
          This page hit an error while loading. Try again — if it keeps happening, your
          cached data may need to be refreshed.
        </p>
        {(error?.message || error?.digest) && (
          <pre className="w-full max-w-md overflow-x-auto rounded-lg bg-[#F5F5F7] p-3 text-left text-[11px] text-[#62646A]">
            {error.message || `digest: ${error.digest}`}
          </pre>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-[#2a2a2a] transition-colors"
          >
            <RefreshCw size={14} />
            Try again
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#151515] text-sm font-medium rounded-xl border border-[#ECEDEE] hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
