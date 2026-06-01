"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { scrollToSection } from "@/lib/utils";

const socialLogos = [
  {
    alt: "Logo",
    src: "/figmaAssets/logo-1.svg",
    link: "https://www.linkedin.com/company/sorene-ai",
  },
  {
    alt: "Logo",
    src: "/figmaAssets/logo-3.svg",
    link: "https://www.instagram.com/sorene.ai",
  },
  {
    alt: "Logo",
    src: "/figmaAssets/logo-4.svg",
    link: "https://www.facebook.com/soreneai/",
  },
  {
    alt: "Logo",
    src: "/figmaAssets/logo.svg",
    link: "https://discord.com/invite/2YtvCm2SWp",
  },
  {
    alt: "Logo",
    src: "/figmaAssets/logo-2.svg",
    link: "https://x.com/soreneai",
  },
  {
    alt: "Logo",
    src: "/figmaAssets/logo-5.svg",
    link: "https://www.youtube.com/@Sorene_ai",
  },
  {
    alt: "Threads",
    src: "/figmaAssets/threads.svg",
    link: "https://www.threads.com/@sorene.ai",
  },
];

type FooterLink = { label: string; sectionId?: string | null; href?: string };

const footerColumns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", sectionId: "features" },
      { label: "Pricing", sectionId: "pricing" },
      { label: "AI Demo", sectionId: "how-it-works" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "FAQs", sectionId: "faq" },
      { label: "Community", sectionId: "testimonials" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
];

export type EarlyAccessCtaSectionProps = {
  // When false, render only the footer (used by pages like Privacy Policy).
  showCta?: boolean;
};

export const EarlyAccessCtaSection = ({
  showCta = true,
}: EarlyAccessCtaSectionProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (path: string) => {
    router.push(path);
    scrollToSection("home");
  };

  return (
    <div className="flex flex-col items-start gap-2 self-stretch w-full bg-white relative overflow-hidden z-0">
      {/* Background blobs moved outside footer to cover half of it */}
      <div className="absolute bottom-0 left-0 right-0 h-[600px] pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1880px] h-[2000px] bg-[#d4f6f9] rounded-[940px/1000px] blur-[150px] opacity-60" />

        <div className="absolute top-[120px] left-1/2 -translate-x-1/2 w-[1670px] h-[1810px] bg-[#fedd90] rounded-[835px/905px] blur-[150px] opacity-60" />

        <div className="absolute top-[300px] left-1/2 -translate-x-1/2 w-[1205px] h-[1500px] bg-[#FDC24C] rounded-[600px/750px] blur-[150px] opacity-60" />
      </div>
      {showCta && (
        <>
          {/* CTA Section */}
          <div className="flex flex-col items-start gap-12 lg:gap-20 pt-16 lg:pt-20 pb-16 lg:pb-[120px] px-5 sm:px-10 lg:px-20 self-stretch w-full">
            <div className="flex flex-col max-w-screen-xl items-center gap-8 lg:gap-10 w-full mx-auto">
              <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto text-center">
                <div className="font-satoshi inline-flex items-center justify-center gap-2 px-5 py-2 bg-white rounded-[40px] border border-solid border-[#EDEDED] shadow-shadow">
                  Your Vision.{" "}
                  <span className="text-[#FDC24C]">Built with Sorene</span>
                </div>
                <h2 className="self-stretch text-transparent text-3xl sm:text-4xl lg:text-5xl text-center leading-tight">
                  <span className="font-medium text-[#101010] tracking-[-0.24px]">
                    Claim Early Bird Access,{" "}
                  </span>
                  <span className="font-satoshi italic text-[#101010] tracking-[-0.48px]">
                    30% Off Pro
                  </span>
                </h2>
                <p className="self-stretch  font-normal text-[#101010] text-base text-center tracking-[0] leading-6">
                  Join as an early supporter and get 30% off your first month of
                  Sorene Pro and receive our exclusive handbook on turning
                  strategic direction into execution.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 self-stretch w-full">
                <div className="inline-flex justify-center gap-2 p-0.5 rounded-[10px] overflow-hidden border border-solid border-[#FDAA22] shadow-shadow items-center [background:radial-gradient(263.36%_77.05%_at_11.85%_23.83%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),#FDC24C]">
                  <Button
                    className="inline-flex items-center justify-center gap-2 px-[18px] py-3.5 rounded-lg bg-transparent hover:bg-transparent shadow-none border-none h-auto font-medium text-white text-sm sm:text-base text-center tracking-[0] leading-6 whitespace-nowrap"
                    variant="ghost"
                  >
                    Unlock Early Bird Offer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="flex flex-col justify-center gap-8 lg:gap-10 pt-10 lg:pt-14 pb-8 px-5 sm:px-10 lg:px-20 self-stretch w-full items-center relative">
        <div className="flex flex-col max-w-7xl items-center gap-8 lg:gap-10 w-full mx-auto relative">
          {/* Top footer — stacked on mobile, side-by-side on md+ */}
          <div className="flex flex-col md:flex-row items-start gap-10 lg:gap-20 self-stretch w-full">
            {/* Brand */}
            <div className="flex flex-col w-full md:w-[280px] lg:w-[342px] items-start gap-6 shrink-0">
              <div className="flex flex-col items-start gap-4 self-stretch w-full">
                <div className="inline-flex items-center gap-[7.38px]">
                  <img
                    onClick={() => handleNavigate("/")}
                    className="w-[172px] h-[40px] cursor-pointer"
                    alt="Vector"
                    src="/figmaAssets/Logo-full-black.png"
                  />
                </div>
                <p className="self-stretch font-normal text-[#101010] text-sm tracking-[0] leading-[21px]">
                  Sorene is a strategic intelligence platform that transforms
                  personal DNA into clear direction and aligned execution.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {socialLogos.map((logo, index) => (
                  <a
                    key={index}
                    href={logo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img className="w-6 h-6" alt={logo.alt} src={logo.src} />
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns — 3 cols on sm+, stacked on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-1 w-full">
              {footerColumns.map((column) => (
                <div
                  key={column.heading}
                  className="flex flex-col items-start gap-3"
                >
                  <p className="self-stretch [font-family:'Inter_Tight',Helvetica] font-normal text-[#242424] text-base leading-6">
                    {column.heading}
                  </p>
                  <div className="flex flex-col items-start gap-2 w-full relative z-10">
                    {column.links.map((link) => {
                      const baseClass = "relative z-10 font-['Inter_Tight',Helvetica] font-medium text-[#101010] text-sm sm:text-base leading-6 hover:underline text-left cursor-pointer py-1";
                      if (link.href) {
                        return (
                          <Link key={link.label} href={link.href} prefetch={false} className={baseClass}>
                            {link.label}
                          </Link>
                        );
                      }
                      return (
                        <button
                          key={link.label}
                          onClick={() => {
                            if (!link.sectionId) return;
                            if (pathname !== "/") {
                              router.push(`/#${link.sectionId}`);
                            } else {
                              scrollToSection(link.sectionId);
                            }
                          }}
                          className={`${baseClass} ${!link.sectionId ? "opacity-50 cursor-default" : ""}`}
                        >
                          {link.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="self-stretch w-full bg-[#101010]" />

          {/* Bottom bar — stacked on mobile */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 self-stretch w-full">
            <span className="font-normal text-[#101010] text-sm sm:text-base leading-6 whitespace-nowrap">
              ©Sorene, Inc. All rights reserved.
            </span>
            <div className="flex items-center gap-4 sm:gap-6 relative z-10">
              <Link
                href="/privacy-policy"
                prefetch={false}
                className="relative z-10 font-normal text-[#101010] text-sm sm:text-base leading-6 whitespace-nowrap hover:underline py-1 cursor-pointer"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                prefetch={false}
                className="relative z-10 font-normal text-[#101010] text-sm sm:text-base leading-6 whitespace-nowrap hover:underline py-1 cursor-pointer"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
