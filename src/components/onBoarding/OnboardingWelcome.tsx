"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
const OnboardingWelcome = ({ onNext }: { onNext: () => void }) => {
  return (
    <div className="relative min-h-screen w-full bg-white flex items-center justify-center p-4">
      {/* Main Content */}
      <div className="flex flex-col items-center gap-8 max-w-md">
        {/* Icon */}
        <img
          className="block h-25 w-25 object-cover "
          alt="Sorene logo"
          src="/figmaAssets/logo.png"
        />

        {/* Heading */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900">
            This is where clarity begins
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Sorene is not here to tell you what to do. it helps you slow <br />
            down, reflect honestly and understand what truly fits you.
          </p>
        </div>

        <Button
          onClick={onNext}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white cursor-pointer font-semibold py-2 px-6 rounded-md"
        >
          GET STARTED
        </Button>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-8 w-full text-center text-gray-500 text-sm">
        By using Sorene, you agree to our 
        {" "}<Link href="/terms-of-service" className="underline hover:text-gray-700">
        Terms
        </Link>{" "}
         and have read our{" "}
        <Link href="/privacy-policy" className="underline hover:text-gray-700">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
