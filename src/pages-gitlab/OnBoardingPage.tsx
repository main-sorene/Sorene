"use client";

import { FormData } from "@/types/onboarding";
import { OnboardingForm } from "@/components/onBoarding/OnboardingForm";
import OnboardingWelcome from "@/components/onBoarding/OnboardingWelcome";
import { useState } from "react";

type OnboardingStep = "welcome" | "form" | "privacy";

export const OnBoardingPage = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [formData, setFormData] = useState<FormData | null>(null);

  const handleWelcomeNext = () => {
    setCurrentStep("form");
  };

  const handleFormNext = (data: FormData) => {
    setFormData(data);
    setCurrentStep("privacy");
  };

  if (currentStep === "welcome") {
    return <OnboardingWelcome onNext={handleWelcomeNext} />;
  }

  if (currentStep === "form") {
    return <OnboardingForm onNext={handleFormNext} />;
  }
};
