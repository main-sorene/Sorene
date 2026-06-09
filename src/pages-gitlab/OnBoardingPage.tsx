"use client";

import { OnboardingForm } from "@/components/onBoarding/OnboardingForm";
import OnboardingWelcome from "@/components/onBoarding/OnboardingWelcome";
import { useState } from "react";

export const OnBoardingPage = () => {
  const [step, setStep] = useState<"welcome" | "form">("welcome");

  if (step === "welcome") {
    return <OnboardingWelcome onNext={() => setStep("form")} />;
  }

  return <OnboardingForm />;
};
