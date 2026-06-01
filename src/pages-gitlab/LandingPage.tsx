"use client";

import LandingLayout from "@/layouts/LandingLayout";
import { BuildDirectionSection } from "./sections/BuildDirectionSection";
import { EarlyAccessCtaSection } from "./sections/EarlyAccessCtaSection";
import { FeaturesOverviewSection } from "./sections/FeaturesOverviewSection";
import { HeroSection } from "./sections/HeroSection";
import { PricingSection } from "./sections/PricingSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { useEffect } from "react";
import { FAQSection } from "./sections/FAQSection";

export const LandingPageScreen = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.replace("#", "");
    if (!id) return;

    // Defer until the section is mounted.
    setTimeout(() => {
      if (id === "footer") {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
        return;
      }
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  return (
    <LandingLayout>
      <div className="flex flex-col w-full">
        <div id="home">
          <HeroSection />
        </div>
        <div id="features">
          <FeaturesOverviewSection />
        </div>
        <div id="testimonials">
          <TestimonialsSection />
        </div>

        <div id="how-it-works">
          <BuildDirectionSection />
        </div>

        <div id="pricing">
          <PricingSection />
        </div>

        <div id="faq">
          <FAQSection />
        </div>

        <div id="footer">
          <EarlyAccessCtaSection />
        </div>
      </div>
    </LandingLayout>
  );
};
