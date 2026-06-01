"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { scrollToSection } from "@/lib/utils";

const featureCards = [
  {
    image: "/figmaAssets/image.png",
    title: "DNA Assessment",
    description:
      "Understand how you are structurally built. Get clarity on your core drivers and energy patterns.",
  },
  {
    image: "/figmaAssets/image-1.png",
    title: "Strategic Direction",
    description:
      "Stop chasing trends. Receive business concepts that match your DNA and long-term positioning.",
  },
  {
    image: "/figmaAssets/image-2.png",
    title: "Chat-First Experience",
    description:
      "No forms. No static reports. Everything happens through a guided, intelligent conversation.",
  },
];

export const FeaturesOverviewSection = () => {
  return (
    <section className="flex flex-col items-center gap-12 lg:gap-20 px-5 sm:px-10 lg:px-20 py-16 lg:py-[100px] self-stretch w-full bg-white">
      <div className="flex flex-col max-w-7xl items-start gap-12 lg:gap-20 w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col items-start gap-6 self-stretch w-full">
          <div className="font-satoshi inline-flex items-center justify-center gap-2 px-5 py-2 bg-white rounded-[40px] border border-solid border-[#EDEDED] shadow-shadow">
            Meet <span className="text-[#FDC24C]">Sorene</span>
          </div>

          {/* Title + description — stacked on mobile, side-by-side on lg */}
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 self-stretch w-full">
            <h2 className="w-full lg:flex-1 text-[#101010] text-3xl sm:text-4xl lg:text-5xl leading-tight">
              <span className="font-inter-tight font-medium tracking-[-0.24px]">
                Stop searching for the right idea.{" "}
              </span>
              <span className="font-satoshi italic tracking-[-0.48px]">
                We find it — built around who you are
              </span>
            </h2>

            <div className="flex flex-col items-start justify-center gap-8 lg:gap-10 w-full lg:flex-1">
              <p className="self-stretch text-[#878787] text-base tracking-[0] leading-6">
                Sorene is an AI-powered platform that starts where every other
                business tool doesn't — with you. Answer 15 questions. Get a
                personalized business idea, a step-by-step plan, and guidance on
                exactly what to do next.
              </p>
              <div className="flex justify-center gap-2 p-0.5 rounded-[10px] border border-solid border-[#FDAA22] shadow-shadow [background:radial-gradient(263.36%_77.05%_at_11.85%_23.83%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),#FDC24C] items-center cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed">
                <Button
                  className="inline-flex items-center justify-center gap-2 px-[18px] py-3.5 rounded-lg bg-transparent hover:bg-transparent shadow-none border-none h-auto font-medium text-white hover:text-white text-sm sm:text-base text-center tracking-[0] leading-6 whitespace-nowrap"
                  variant="ghost"
                  onClick={() => scrollToSection("home")}
                >
                  Start Your DNA Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards — 1 col mobile, 2 cols md, 3 cols lg */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 self-stretch w-full">
          {featureCards.map((card, index) => (
            <Card
              key={index}
              className="p-6 bg-white rounded-2xl border border-solid border-[#ededed] shadow-shadow"
            >
              <CardContent className="flex flex-col items-start gap-4 p-0">
                <div
                  className="self-stretch w-full h-[200px] sm:h-[245px] rounded-xl"
                  style={{
                    backgroundImage: `url(${card.image})`,
                    backgroundPosition: "50% 50%",
                    backgroundSize: "cover",
                  }}
                />
                <div className="flex flex-col items-start justify-center gap-2 self-stretch w-full">
                  <h3 className="self-stretch font-satoshi text-2xl ">
                    {card.title}
                  </h3>
                  <p className="self-stretch font-inter-tight font-normal text-[#878787] text-base tracking-[0] leading-6">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
