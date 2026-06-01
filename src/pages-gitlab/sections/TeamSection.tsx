"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { EmblaCarouselType } from "embla-carousel";
import clsx from "clsx";
import useEmblaCarousel from "embla-carousel-react";

export type TeamMember = {
  image: string;
  name: string;
  title: string;
  description: string;
  linkedin?: string | undefined;
};

const teamMembers: TeamMember[] = [
  {
    image: "/figmaAssets/image-4.png",
    name: "Mai Nguyen",
    title: "CEO & Founder",
    description:
      "10+ years marketing leadership across APAC, MBA Liverpool John Moores.",
    linkedin: "https://www.linkedin.com/in/mainguyen1992/",
  },
  {
    image: "/figmaAssets/adam.png",
    name: "Adam Lim",
    title: "Lead Developer",
    description:
      "Self-taught AI engineer and builder; 10+ years programming, focused on cross-platform AI agents.",
    linkedin: "#",
  },
  {
    image: "/figmaAssets/justin.png",
    name: "Justin Tran",
    title: "Product Manager",
    description:
      "Product and brand manager; 5+ years UX/UI leadership across agencies and tech startups.",
    linkedin: "https://www.linkedin.com/in/justin-tran01/",
  },
  {
    image: "/figmaAssets/michael-horton.png",
    name: "Michael Hathorn",
    title: "Business Advisor",
    description:
      "Senior Partner at Optimis; Professor at University of St. Gallen; PhD in Corporate Governance.",
    linkedin: "https://www.linkedin.com/in/michael-hathorn-phd/",
  },
  {
    image: "/figmaAssets/image-7.png",
    name: "Sitsari Kitisakkul",
    title: "Business Advisor",
    description:
      "Managing Director at Appsynth (acquired by Deloitte); USC Marshall MBA.",
    linkedin: "#",
  },
  {
    image: "/figmaAssets/annie-garofalo.png",
    name: "Annie Garofalo",
    title: "Business Advisor",
    description:
      "Founding Team & Relationship Expert; Harvard Medical School; Stanford MBA; Harvard B.A.",
    linkedin: "https://www.linkedin.com/in/annie-garofalo/",
  },
  // {
  //   image: "/figmaAssets/image-8.png",
  //   name: "Jonathan Reekurt",
  //   title: "Business Advisor",
  //   description:
  //     "Founder and CEO of Zetakree Biotech, a pioneering health technology company operating across Dubai, Nigeria, Canada, and the UK.",
  //   linkedin: undefined,
  // },
];

export const TeamSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
  });

  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setPrevDisabled(!api.canScrollPrev());
    setNextDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="flex flex-col items-center gap-12 lg:gap-20 px-5 sm:px-10 lg:px-20 py-16 lg:py-[100px] w-full bg-white">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header: Heading + Arrows in same row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-12 my-10">
          {/* Left Side - Heading */}
          <div className="max-w-4xl flex-shrink-0">
            <div className="font-satoshi inline-flex items-center justify-center gap-2 px-5 py-2 bg-white rounded-[40px] border border-solid border-[#EDEDED] shadow-shadow">
              Founding<span className="text-[#FDC24C]">Team</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight text-[#101010]">
              <span className="font-medium">
                Built by People Who Believe in{" "}
              </span>
              <span className="font-satoshi italic font-normal">
                Amplifying Human Potential Through AI & Technology
              </span>
            </h2>
          </div>

          {/* Right Side - Arrows */}
          <div className="shrink-0 pt-3 lg:pt-6">
            <div className="flex gap-3">
              <button
                onClick={scrollPrev}
                disabled={prevDisabled}
                className={clsx(
                  "w-10 h-10 flex items-center justify-center rounded-lg border",
                  "border-[#fdaa22] text-[#fdaa22]",
                  prevDisabled && "opacity-40 cursor-not-allowed",
                )}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={scrollNext}
                disabled={nextDisabled}
                className={clsx(
                  "w-10 h-10 flex items-center justify-center rounded-lg",
                  "bg-[#fdaa22] text-white",
                  nextDisabled && "opacity-40 cursor-not-allowed",
                )}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="overflow-hidden cursor-grab active:cursor-grabbing"
          ref={emblaRef}
        >
          <div className="flex gap-5">
            {teamMembers.map((member, index) => {
              const isClickable = !!member.linkedin && member.linkedin !== "#";
              const Tag = isClickable ? "a" : "div";

              return (
                <div key={index} className="flex-[0_0_240px] min-w-0">
                  <Tag
                    {...(isClickable
                      ? {
                          href: member.linkedin,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {})}
                    className="block h-full"
                  >
                    <div className="bg-white border border-[#ededed] rounded-xl p-4 shadow-sm h-[350px] flex flex-col">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-[150px] rounded-md object-cover shrink-0"
                      />
                      <div className="text-center mt-3 flex-1 flex flex-col">
                        <p className="font-satoshi text-sm lg:text-2xl text-[#101010] shrink-0">
                          {member.name}
                        </p>
                        <p className="text-sm text-[#101010] shrink-0">
                          {member.title}
                        </p>
                        <p className="text-xsm text-[#878787] text-left mt-2 leading-5 line-clamp-5 text-ellipsis overflow-hidden">
                          {member.description}
                        </p>
                      </div>
                    </div>
                  </Tag>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
