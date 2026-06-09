"use client";

import { Card, CardContent } from "@/components/ui/card";
import { scrollToSection } from "@/lib/utils";

import { billingYearlyAtom } from "@/store/atoms";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";

const basicFeatures = [
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Chat-based DNA Assessment",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "DNA Summary (in-chat overview)",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Structured DNA Page (basic view)",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Business Idea Generation",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Limited Chat Interaction",
  },
  { icon: "/figmaAssets/x.svg", alt: "X", text: "No Deep DNA Refinement" },
  { icon: "/figmaAssets/x.svg", alt: "X", text: "No Detailed Direction Page" },
  { icon: "/figmaAssets/x.svg", alt: "X", text: "No Unlimited Memory" },
];

const proFeatures = [
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Full Chat-based DNA Assessment",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Unlimited DNA Refinement",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Complete Strategic Direction Generation",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Full Direction Detail Page",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Actionable Execution Roadmap",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Bite-Sized Micro Learning",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Ongoing Direction Updates",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Priority AI Processing",
  },
  { icon: "/figmaAssets/check.svg", alt: "Check", text: "Priority Support" },
];

const professionalFeatures = [
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Everything in Starter",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Up to 5x more usage than Starter",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Early access to advanced Sorene features",
  },
  {
    icon: "/figmaAssets/check.svg",
    alt: "Check",
    text: "Priority access at high traffic time",
  },
];

export const PricingSection = () => {
  const [billingYearly, setBillingYearly] = useAtom(billingYearlyAtom);
  const router = useRouter();

  return (
    <div className="px-4 sm:px-5 py-4 flex flex-col items-center gap-12 lg:gap-20 self-stretch w-full bg-white">
      <div className="flex flex-col items-start gap-2.5 px-5 sm:px-8 lg:px-16 py-14 lg:py-[84px] self-stretch w-full bg-[#f9f9f9] rounded-2xl lg:rounded-3xl">
        <div className="flex flex-col max-w-screen-xl items-center gap-12 lg:gap-20 w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto text-center">
            <div className="font-satoshi inline-flex items-center justify-center gap-2 px-5 py-2 bg-white rounded-[40px] border border-solid border-[#EDEDED] shadow-shadow">
              Simple &<span className="text-[#FDC24C]">Transparent</span>
            </div>
            <h2 className="self-stretch font-normal text-[#101010] text-3xl sm:text-4xl lg:text-5xl text-center leading-tight">
              <span className="font-medium tracking-[-0.24px]">
                Transparent Pricing That
                <br />
              </span>
              <span className="font-satoshi italic tracking-[-0.48px]">
                Grows With You
              </span>
            </h2>
            <p className="self-stretch font-normal text-[#878787] text-base text-center tracking-[0] leading-6">
              Whether you&#39;re just getting started or scaling fast, our
              pricing adapts to your journey. Start with a free trial to explore
              powerful features, then upgrade to unlock even more flexibility,
              customization, and support as your needs grow.
            </p>
          </div>

          {/* Pricing cards — stacked on mobile, side by side on md+ */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 self-stretch w-full">
            {/* Basic Card */}
            <Card className="flex flex-col w-full h-[575px] md:max-w-[500px] align-middle justify-center md:flex-1 bg-white rounded-2xl overflow-hidden border border-solid border-[#ededed] shadow-none">
              <CardContent className="p-0 flex flex-col flex-1">
                <div className="flex flex-col items-start gap-4 p-6 border-b border-solid border-[#ededed]">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className=" font-medium text-[#101010] text-lg leading-[21.6px]">
                      Free
                    </div>
                    <div className=" font-normal text-[#878787] text-base leading-6">
                      Perfect for exploring the essentials.
                    </div>
                  </div>
                  <div className="font-satoshi font-satoshi-heading-h3-40-regular font-[number:var(--satoshi-heading-h3-40-regular-font-weight)] text-[#101010] text-[length:var(--satoshi-heading-h3-40-regular-font-size)] tracking-[var(--satoshi-heading-h3-40-regular-letter-spacing)] leading-[var(--satoshi-heading-h3-40-regular-line-height)] [font-style:var(--satoshi-heading-h3-40-regular-font-style)]">
                    $0
                  </div>
                  <button
                    className="flex justify-center gap-2 p-0.5 self-stretch w-full bg-white rounded-[10px] border border-solid border-[#ededed] shadow-shadow items-center"
                    onClick={() => scrollToSection("home")}
                  >
                    <div className="flex items-center justify-center gap-2 px-3.5 py-2 flex-1 bg-white rounded-lg">
                      <span className="font-medium text-[#101010] text-sm text-center leading-[21px] whitespace-nowrap">
                        Get Started for Free
                      </span>
                    </div>
                  </button>
                </div>
                <div className="flex flex-col items-start gap-6 p-6 flex-1">
                  <div className="flex flex-col items-start gap-4 w-full">
                    {basicFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 w-full"
                      >
                        <img
                          className="w-5 h-5 flex-shrink-0"
                          alt={feature.alt}
                          src={feature.icon}
                        />
                        <span className="flex-1 font-medium text-[#101010] text-sm sm:text-base leading-6">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Card */}
            <div className="flex flex-col w-full md:max-w-[500px] md:flex-1 self-stretch rounded-2xl overflow-hidden border-4 border-solid border-[#fdc24c] shadow-yellow-shadow [background:radial-gradient(50%_50%_at_12%_24%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),linear-gradient(0deg,rgba(253,194,76,1)_0%,rgba(253,194,76,1)_100%)]">
              <div className="flex items-center justify-center px-6 py-2 w-full">
                <span className="font-medium text-white text-base leading-6 whitespace-nowrap">
                  Most Popular
                </span>
              </div>
              <div className="flex flex-col items-start w-full flex-1 bg-white rounded-[16px_16px_0px_0px]">
                <div className="flex flex-col items-start gap-4 p-6 border-b border-solid border-[#fdc24c] w-full">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className=" font-medium text-[#101010] text-lg leading-[21.6px]">
                      Starter
                    </div>
                    <div className="font-normal text-[#878787] text-base leading-6">
                      For creators and businesses ready to launch.
                    </div>
                  </div>
                  <div className="font-satoshi font-satoshi-heading-h3-40-regular font-[number:var(--satoshi-heading-h3-40-regular-font-weight)] text-[#101010] text-[length:var(--satoshi-heading-h3-40-regular-font-size)] tracking-[var(--satoshi-heading-h3-40-regular-letter-spacing)] leading-[var(--satoshi-heading-h3-40-regular-line-height)] [font-style:var(--satoshi-heading-h3-40-regular-font-style)]">
                    {"$75 / 6 months"}
                  </div>
                  <div className="inline-flex items-center gap-3">
                    <div className="font-satoshi text-base text-[#FDC24C]">
                      Save <span className="text-lg ">17%</span>
                    </div>
                    <button
                      onClick={() => setBillingYearly(!billingYearly)}
                      className="flex w-12 items-center justify-end gap-2.5 p-0.5 rounded-[100px] [background:radial-gradient(50%_50%_at_12%_24%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),linear-gradient(0deg,rgba(253,194,76,1)_0%,rgba(253,194,76,1)_100%)]"
                    >
                      <div className="w-6 h-6 bg-white rounded-[100px] shadow-shadow" />
                    </button>
                  </div>
                  <button
                    className="flex justify-center gap-2 p-0.5 self-stretch w-full rounded-[10px] border border-solid border-[#fdc24c] shadow-shadow [background:radial-gradient(50%_50%_at_12%_24%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),linear-gradient(0deg,rgba(253,194,76,1)_0%,rgba(253,194,76,1)_100%)] items-center"
                    onClick={() => router.push("/upgrade?plan=starter")}
                  >
                    <div className="flex items-center justify-center gap-2 px-3.5 py-2 flex-1 rounded-lg">
                      <span className="font-medium text-white text-sm text-center leading-[21px] whitespace-nowrap">
                        Get Started
                      </span>
                    </div>
                  </button>
                </div>
                <div className="flex flex-col items-start gap-6 p-6 flex-1 w-full">
                  <div className="flex flex-col items-start gap-4 w-full">
                    {proFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 w-full"
                      >
                        <img
                          className="w-5 h-5 flex-shrink-0"
                          alt={feature.alt}
                          src={feature.icon}
                        />
                        <span className="flex-1 font-medium text-[#101010] text-sm sm:text-base leading-6">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Professional Card */}
            <Card className="flex flex-col w-full h-[460px] md:max-w-[460px] md:flex-1 bg-white rounded-2xl overflow-hidden border border-solid border-[#ededed] shadow-none">
              <CardContent className="p-0 flex flex-col flex-1">
                {/* Header */}
                <div className="flex flex-col items-start gap-4 p-6 border-b border-solid border-[#ededed]">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <div className="font-medium text-[#101010] text-lg">
                      Professional
                    </div>
                    <div className=" text-[#878787] text-base">
                      Tailored to teams, agencies, and enterprises.
                    </div>
                  </div>

                  {/* Price */}
                  <div className="font-satoshi text-3xl text-[#101010]">
                    $206 / 6 months
                  </div>

                  {/* Toggle */}
                  <div className="inline-flex items-center gap-3">
                    <span className="font-satoshi text-base text-[#101010]">
                      Save <span className="text-lg">30%</span>
                    </span>
                    <button
                      onClick={() => setBillingYearly(!billingYearly)}
                      className="flex w-12 items-center justify-end p-0.5 rounded-full bg-[#101010]"
                    >
                      <div className="w-6 h-6 bg-white rounded-full" />
                    </button>
                  </div>

                  {/* CTA */}
                  <button
                    className="flex justify-center gap-2 p-0.5 se878787lf-stretch w-full bg-white rounded-[10px] border border-solid border-[#ededed]"
                    onClick={() => router.push("/upgrade?plan=pro")}
                  >
                    <div className="flex items-center justify-center px-3.5 py-2 flex-1">
                      <span className="text-sm font-medium text-[#101010]">
                        Get Started
                      </span>
                    </div>
                  </button>
                </div>

                {/* Features */}
                <div className="flex flex-col items-start gap-6 p-6 flex-1">
                  <div className="flex flex-col items-start gap-4 w-full">
                    {professionalFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 w-full"
                      >
                        <img
                          className="w-5 h-5"
                          src={feature.icon}
                          alt={feature.alt}
                        />
                        <span className="text-sm sm:text-base font-medium text-[#101010]">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-3 w-full text-center text-sm text-[#878787]">
          Prices shown do not include applicable tax.
        </div>
      </div>
    </div>
  );
};
