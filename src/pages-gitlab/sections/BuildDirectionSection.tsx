"use client";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { scrollToSection } from "@/lib/utils";

// Initial steps without "active" key
const initialSteps = [
  {
    number: "01",
    title: "Discover Your DNA",
    description:
      "Understand how you naturally think and work. Sorene analyzes your responses to reveal the core drivers behind what you should build.",
  },
  {
    number: "02",
    title: "Create Your Direction",
    description:
      "Using your DNA, Sorene generates strategic directions and business paths that fit your strengths and motivations.",
  },
  {
    number: "03",
    title: "Build What Fits",
    description:
      "Turn the direction into a clear starting point with structured ideas and a foundation you can refine and launch.",
  },
];

export const BuildDirectionSection = () => {
  const [activeStep, setActiveStep] = useState(0); // Track which step is active

  return (
    <section className="px-5 sm:px-10 lg:px-20 py-16 lg:py-20 flex flex-col items-center gap-12 lg:gap-20 self-stretch w-full bg-white">
      <div className="flex flex-col max-w-screen-xl items-start gap-12 lg:gap-20 w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col items-start gap-6 self-stretch w-full">
          <div className="font-satoshi inline-flex items-center justify-center gap-2 px-5 py-2 bg-white rounded-[40px] border border-solid border-[#EDEDED] shadow-shadow">
            See It in <span className="text-[#FDC24C]"> Action</span>
          </div>

          {/* Heading + description */}
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 self-stretch w-full">
            <h2 className="w-full lg:flex-1 font-normal text-[#101010] text-3xl sm:text-4xl lg:text-5xl leading-tight">
              <span className="font-medium tracking-[-0.24px]">
                Build a Direction
                <br />
              </span>
              <span className="font-satoshi italic tracking-[-0.48px]">
                in Minutes Not Days
              </span>
            </h2>
            <div className="flex flex-col items-start gap-8 lg:gap-10 w-full lg:flex-1">
              <p className="self-stretch font-normal text-[#878787] text-base tracking-[0] leading-6">
                If you feel stuck or uncertain about what to build next, Sorene
                helps you move forward fast. In minutes, you&apos;ll understand
                your core drivers and the direction that truly fits you.
              </p>
              <div className="inline-flex justify-center gap-2 p-0.5 rounded-[10px] overflow-hidden border border-solid border-[#fdaa22] shadow-shadow items-center [background:radial-gradient(263.36%_77.05%_at_11.85%_23.83%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),#FDC24C]">
                <Button
                  className="inline-flex  items-center justify-center gap-2 px-[18px] py-3.5 rounded-lg bg-transparent hover:bg-transparent shadow-none border-none h-auto font-medium text-white hover:text-white text-sm sm:text-base text-center tracking-[0] leading-6 whitespace-nowrap"
                  variant="ghost"
                  onClick={() => scrollToSection("home")}
                >
                  Start Your DNA Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Steps + image */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 self-stretch w-full">
          {/* Step cards */}
          <div className="flex flex-col items-start gap-4 sm:gap-6 w-full lg:flex-1">
            {initialSteps.map((step, index) => {
              const isActive = index === activeStep;
              return (
                <Card
                  key={step.number}
                  onClick={() => setActiveStep(index)} // Make step clickable
                  className={`cursor-pointer flex items-center gap-4 p-5 sm:p-6 self-stretch w-full rounded-2xl overflow-hidden shadow-shadow ${
                    isActive
                      ? "border-2 border-solid border-[#fdc24c]"
                      : "border border-solid border-[#ededed]"
                  }`}
                >
                  <CardContent className="flex items-center gap-4 p-0 w-full">
                    <div
                      className={`inline-flex justify-center gap-2 p-0.5 rounded-[10px] overflow-hidden border shadow-shadow items-center flex-shrink-0 ${
                        isActive
                          ? "border-solid border-[#fdc24c] [background:radial-gradient(50%_50%_at_12%_24%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),linear-gradient(0deg,rgba(253,194,76,1)_0%,rgba(253,194,76,1)_100%)]"
                          : "border-solid border-[#ededed] bg-white"
                      }`}
                    >
                      <div
                        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg ${isActive ? "" : "bg-white"}`}
                      >
                        <span
                          className={`font-satoshi font-[number:var(--satoshi-heading-h6-18-regular-font-weight)] text-[length:var(--satoshi-heading-h6-18-regular-font-size)] text-center tracking-[var(--satoshi-heading-h6-18-regular-letter-spacing)] leading-[var(--satoshi-heading-h6-18-regular-line-height)] whitespace-nowrap [font-style:var(--satoshi-heading-h6-18-regular-font-style)] ${isActive ? "text-white" : "text-[#101010]"}`}
                        >
                          {step.number}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:gap-2 flex-1">
                      <h3 className="self-stretch font-satoshi font-[number:var(--satoshi-heading-h5-24-regular-font-weight)] text-[#101010] text-[length:var(--satoshi-heading-h5-24-regular-font-size)] tracking-[var(--satoshi-heading-h5-24-regular-letter-spacing)] leading-[var(--satoshi-heading-h5-24-regular-line-height)] [font-style:var(--satoshi-heading-h5-24-regular-font-style)]">
                        {step.title}
                      </h3>
                      <p className="self-stretch font-normal text-[#878787] text-sm sm:text-base tracking-[0] leading-6">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Image */}
          <div
            className="w-full lg:flex-1 h-[280px] sm:h-[360px] lg:h-[447px] rounded-[24px] lg:rounded-[32px]"
            style={{
              background: "url(/figmaAssets/image-3.png) 50% 50% / cover",
            }}
            role="img"
            aria-label="Direction builder preview"
          />
        </div>
      </div>
    </section>
  );
};
