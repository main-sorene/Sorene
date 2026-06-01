"use client";

export type TeamMember = {
  image: string;
  name: string;
  title: string;
  description: string;
  linkedin: string;
};

type TeamCarouselProps = {
  teamMembers: TeamMember[];
  showHeaderControls?: boolean;
};

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";

export const TeamCarousel = ({
  teamMembers,
  showHeaderControls,
}: TeamCarouselProps) => {
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
    <div className="w-full">
      {/* Header Controls (RIGHT SIDE) */}
      {showHeaderControls && (
        <div className="flex justify-end gap-3 mb-6">
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
      )}

      {/* Carousel */}
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        ref={emblaRef}
      >
        <div className="flex gap-5">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex-[0_0_240px]">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="bg-white border border-[#ededed] rounded-xl p-4 shadow-sm">
                  {/* Image */}
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-[150px] rounded-md object-cover"
                  />

                  {/* Content */}
                  <div className="text-center mt-3">
                    <p className="text-sm font-medium text-[#101010]">
                      {member.name}
                    </p>
                    <p className="text-xs text-[#101010]">{member.title}</p>
                    <p className="text-xs text-[#9ca3af] mt-2 leading-5">
                      {member.description}
                    </p>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
