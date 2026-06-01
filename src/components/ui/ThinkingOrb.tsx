import { cn } from "@/lib/utils";

interface ThinkingOrbProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ThinkingOrb({ className, size = "md" }: ThinkingOrbProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-24 h-24",
  };

  const blurClasses = {
    sm: "blur-[6px]",
    md: "blur-[12px]",
    lg: "blur-[24px]",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0",
        sizeClasses[size],
        className,
      )}
    >
      {/* Animated Background Layers */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-[#E8F4FF] opacity-60 animate-pulse",
          blurClasses[size],
        )}
        style={{ animationDuration: "3s" }}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-[#FFF9E6] opacity-50 animate-pulse delay-75",
          blurClasses[size],
        )}
        style={{ animationDuration: "4s" }}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-[#E6FFFA] opacity-40 animate-pulse delay-150",
          blurClasses[size],
        )}
        style={{ animationDuration: "5s" }}
      />

      {/* The Core Orb */}
      <div
        className={cn(
          "relative rounded-full bg-linear-to-br from-white via-[#F8FAFC] to-[#F1F5F9] shadow-[inset_0px_1px_2px_rgba(255,255,255,0.8),0px_2px_4px_rgba(0,0,0,0.05)] border border-white/40",
          size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-16 h-16",
        )}
      >
        {/* Subtle internal gradient overlay */}
        <div className="absolute inset-0 rounded-full bg-linear-to-tr from-[#98E5D1]/20 via-[#FFF3D0]/20 to-[#ADE6FF]/20 mix-blend-overlay" />
      </div>
    </div>
  );
}
