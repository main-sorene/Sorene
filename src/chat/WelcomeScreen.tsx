"use client";

import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import { ChatInput } from "./ChatInput";
import { useRouter } from "next/navigation";
import { useRecipePreset } from "@/hooks/useRecipePreset";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function WelcomeScreen() {
  const [authUser] = useAtom(userAtom);
  const router = useRouter();
  const greeting = getGreeting();

  const { suggestionLabels, handleRecipeClick } = useRecipePreset({
    segment: "chat",
    onConversationCreated: (convId) => router.push(`/chat/${convId}`),
  });

  return (
    <div className="mt-20 flex flex-col items-center justify-start px-4 sm:px-8">
      <div className="w-full max-w-5xl">
        {/* Gradient Sparkle Icon */}
        <div className="mb-6">
          <img alt="Sorene logo" src="/figmaAssets/cube.svg" />
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1
            className="text-[32px] sm:text-[40px] text-heading-medium font-medium text-[#111111] leading-tight mb-1"
            style={{
              fontFamily: "Satoshi, Helvetica",
              letterSpacing: "-0.5px",
            }}
            data-testid="welcome-heading"
          >
            {greeting}, {authUser?.profile?.firstName}{" "}{authUser?.profile?.lastName}!
          </h1>
          <h2
            className="text-[32px] sm:text-[40px] font-medium text-[#111111] leading-tight"
            style={{
              fontFamily: "Satoshi, Helvetica",
              letterSpacing: "-0.5px",
            }}
          >
            What's on your mind?
          </h2>
        </div>
        <ChatInput
          suggestions={suggestionLabels}
          onSuggestionClick={handleRecipeClick}
          className="w-full max-w-5xl"
          disableNavigation
        />
      </div>
    </div>
  );
}
