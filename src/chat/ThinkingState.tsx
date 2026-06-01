import { useEffect, useState } from "react";

interface ThinkingStateProps {
  type?: "chat" | "psychometric" | "dna" | "ideation" | "execution";
}

export function ThinkingState({ type = "chat" }: ThinkingStateProps) {
  const TOTAL_TIME = 120; // seconds
  const [progress, setProgress] = useState(0); // 0 → 1

  useEffect(() => {
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const value = Math.min(elapsed / TOTAL_TIME, 1);
      setProgress(value);

      if (value === 1) clearInterval(interval);
    }, 50); // smooth update

    return () => clearInterval(interval);
  }, []);

  if (type === "psychometric") {
    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 mt-1">
            <img alt="Sorene logo" src="/figmaAssets/cube.svg" />
          </div>
          <p className="text-base text-[#8A8D93] font-normal">
            Working on your DNA...
          </p>
        </div>

        <div className="max-w-4xl bg-[#F7F7F7] border border-[#ECEDEE] rounded-2xl p-5 shadow-sm mt-1">
          <div className="flex items-start gap-4">
            {/* ✅ Progress Ring */}
            <div className="relative w-10 h-10 shrink-0">
              {/* Animated Progress Border */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#4E5055 ${progress * 360}deg, transparent 0deg)`,
                }}
              />

              {/* Inner Circle */}
              <div className="absolute inset-[2px] rounded-full bg-white border border-[#ECEDEE] flex items-center justify-center shadow-sm">
                <img
                  src="/figmaAssets/dna.svg"
                  className="w-5 h-5 opacity-70"
                  alt="DNA"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-medium text-[#151515]">
                Analyzing your answer
              </h4>
              <p className="text-sm text-[#62646A]">
                This process can take 1–2 mins
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center gap-3 animate-in fade-in duration-500">
      <div className="h-11 w-11 mt-1">
        <img alt="Sorene logo" src="/figmaAssets/cube.svg" />
      </div>
      <p className="text-base text-[#8A8D93] font-normal">
        Searching the web for the latest info...
      </p>
    </div>
  );
}
