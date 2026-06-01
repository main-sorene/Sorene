import { Card, CardContent } from "@/components/ui/card";

const allTestimonials = [
  {
    id: 1,
    quote: '"It saved me months of the wrong execution."',
    body: "I was about to launch something that didn't fit me. Sorene made the mismatch obvious before I committed fully.",
    name: "Jonathan Reyes",
    title: "Founder, MarketMinded",
    avatar: "/figmaAssets/avatar.png",
  },
  {
    id: 2,
    quote: '"It explained patterns I couldn\'t figure out."',
    body: "I used to think I was inconsistent. Sorene showed me there was a structure behind how I make decisions and take risks.",
    name: "Ricky Santoso",
    title: "Ecommerce Owner, GadgetNest ID",
    avatar: "/figmaAssets/avatar-1.png",
  },
  {
    id: 4,
    quote: '"The ideas actually matched how I think."',
    body: "Instead of generic startup advice, I got business concepts that matched my energy, risk level, and long-term thinking.",
    name: "Nabila Putri",
    title: "Project Manager, StudioKonten",
    avatar: "/figmaAssets/avatar-3.png",
  },
  {
    id: 5,
    quote: '"Strategy finally felt personal."',
    body: "The Direction output connected who I am with what I should build. It removed a lot of internal friction.",
    name: "Michael Prasetyo",
    title: "Web Consultant, Nexa Partners",
    avatar: "/figmaAssets/avatar-4.png",
  },
];

const TestimonialCard = ({
  quote,
  body,
  name,
  title,
  avatar,
}: {
  quote: string;
  body: string;
  name: string;
  title: string;
  avatar: string;
}) => (
  <Card className="flex flex-col items-start p-6 bg-white rounded-2xl border border-solid border-[#ededed] shadow-shadow h-full">
    <CardContent className="flex flex-col items-start justify-between flex-1 w-full p-0 gap-6">
      <div className="flex flex-col items-start gap-2 w-full">
        <div className="font-satoshi text-[#101010] ">{quote}</div>
        <div className="text-[#878787] text-base tracking-[0] leading-6 font-normal">
          {body}
        </div>
      </div>
      <div className="flex items-center gap-3 w-full">
        <div
          className="w-12 h-12 rounded-full border border-solid border-white shrink-0"
          style={{ background: `url(${avatar}) 50% 50% / cover` }}
        />
        <div className="flex flex-col items-start justify-center flex-1">
          <div className="[font-family:'Inter_Tight',Helvetica] font-medium text-[#101010] text-base tracking-[0] leading-6">
            {name}
          </div>
          <div className="[font-family:'Inter_Tight',Helvetica] font-normal text-[#878787] text-sm tracking-[0] leading-5">
            {title}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const TestimonialsSection = () => {
  return (
    <section className="px-5 sm:px-10 lg:px-20 py-16 lg:py-20 flex flex-col items-center gap-12 lg:gap-20 self-stretch w-full bg-white overflow-hidden">
      <div className="flex flex-col max-w-7xl items-center gap-12 lg:gap-20 w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto text-center">
          <div className="font-satoshi inline-flex items-center justify-center gap-2 px-5 py-2 bg-white rounded-[40px] border border-solid border-[#EDEDED] shadow-shadow">
            Trusted{" "}
            <span className="text-[#FDC24C]">by Builder Everywhere</span>
          </div>
          <h2 className="self-stretch font-normal text-[#101010] text-3xl sm:text-4xl lg:text-5xl text-center leading-tight">
            <span className="font-medium tracking-[-0.24px]">
              Real Clarity from Real Builders
              <br />
            </span>
            <span className="font-satoshi italic tracking-[-0.48px]">
              Who Built Smarter with Us.
            </span>
          </h2>
          <p className="self-stretch font-normal text-[#878787] text-base text-center tracking-[0] leading-6">
            Founders, operators, and creators use Sorene to stop guessing — and
            start building in alignment with who they are.
          </p>
        </div>

        {/* Testimonials — Featured card on mobile, full rotated layout on xl */}
        <div className="w-full">
          {/* Mobile/Tablet: simple grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:hidden">
            {/* Featured card */}
            <div className="sm:col-span-2 flex flex-col items-start p-6 rounded-2xl border-4 border-solid border-[#fdc24c] shadow-yellow-shadow [background:radial-gradient(263.36%_77.05%_at_11.85%_23.83%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),#FDC24C]">
              <div className="flex flex-col gap-6 w-full">
                <div className="font-satoshi   text-white">
                  I finally stopped feeling lost.
                </div>
                <div className=" text-white text-base tracking-[0] leading-6 font-normal">
                  Before Sorene, I kept second-guessing every direction. The DNA
                  breakdown gave me clarity on what truly fits me — and the
                  confidence to move forward.
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full border border-solid border-white shrink-0"
                    style={{
                      background:
                        "url(/figmaAssets/avatar-2.png) 50% 50% / cover",
                    }}
                  />
                  <div className="flex flex-col">
                    <div className="[font-family:'Inter_Tight',Helvetica] font-medium text-white text-base">
                      May Hoang
                    </div>
                    <div className="[font-family:'Inter_Tight',Helvetica] font-normal text-white text-sm">
                      Founder, The Circle Technology
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial cards */}
            {allTestimonials.map((t, index) => (
              <div
                key={t.id}
                className={index % 2 === 0 ? "rotate-[4deg]" : "rotate-[-4deg]"}
              >
                <TestimonialCard {...t} />
              </div>
            ))}
          </div>

          {/* Desktop XL: rotated card layout */}
          <div className="hidden xl:flex lg:flex md:flex items-center justify-center gap-4 w-full">
            {/* Left cards */}
            <div className="flex  gap-6 shrink-0">
              <Card className="flex flex-col w-[320px] items-start p-6 bg-white rounded-2xl border border-solid border-[#ededed] shadow-shadow rotate-[4deg]">
                <CardContent className="flex flex-col items-start justify-between gap-6 w-full p-0">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="font-satoshi font-[number:var(--satoshi-heading-h5-24-regular-font-weight)] text-[#101010] text-[length:var(--satoshi-heading-h5-24-regular-font-size)] tracking-[var(--satoshi-heading-h5-24-regular-letter-spacing)] leading-[var(--satoshi-heading-h5-24-regular-line-height)] [font-style:var(--satoshi-heading-h5-24-regular-font-style)]">
                      {allTestimonials[0].quote}
                    </div>
                    <div className="text-[#878787] text-sm leading-5">
                      {allTestimonials[0].body}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{
                        background: `url(${allTestimonials[0].avatar}) 50% 50% / cover`,
                      }}
                    />
                    <div>
                      <div className="font-medium text-[#101010] text-sm">
                        {allTestimonials[0].name}
                      </div>
                      <div className=" text-[#878787] text-xs">
                        {allTestimonials[0].title}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex flex-col w-[320px] items-start p-6 bg-white rounded-2xl border border-solid border-[#ededed] shadow-shadow rotate-[-4deg]">
                <CardContent className="flex flex-col items-start justify-between gap-6 w-full p-0">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="font-satoshi font-[number:var(--satoshi-heading-h5-24-regular-font-weight)] text-[#101010] text-[length:var(--satoshi-heading-h5-24-regular-font-size)] tracking-[var(--satoshi-heading-h5-24-regular-letter-spacing)] leading-[var(--satoshi-heading-h5-24-regular-line-height)] [font-style:var(--satoshi-heading-h5-24-regular-font-style)]">
                      {allTestimonials[1].quote}
                    </div>
                    <div className="text-[#878787] text-sm leading-5">
                      {allTestimonials[1].body}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{
                        background: `url(${allTestimonials[1].avatar}) 50% 50% / cover`,
                      }}
                    />
                    <div>
                      <div className="font-medium text-[#101010] text-sm">
                        {allTestimonials[1].name}
                      </div>
                      <div className="text-[#878787] text-xs">
                        {allTestimonials[1].title}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center featured card */}
            <Card className="w-[380px] border-[#fdaa22] shadow-yellow-shadow [background:radial-gradient(50%_50%_at_12%_24%,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_100%),linear-gradient(0deg,rgba(253,194,76,1)_0%,rgba(253,194,76,1)_100%)] flex flex-col items-start p-6 rounded-2xl border border-solid shrink-0 z-10">
              <CardContent className="flex flex-col items-start justify-between gap-8 w-full p-0">
                <div className="flex flex-col gap-2 w-full">
                  <div className="font-satoshi text-white text-[length:var(--satoshi-heading-h3-40-regular-font-size)] tracking-[var(--satoshi-heading-h3-40-regular-letter-spacing)] leading-[var(--satoshi-heading-h3-40-regular-line-height)] font-[number:var(--satoshi-heading-h3-40-regular-font-weight)] [font-style:var(--satoshi-heading-h3-40-regular-font-style)]">
                    I finally stopped feeling lost.
                  </div>
                  <div className="text-white text-body-large leading-6">
                    Before Sorene, I kept second-guessing every direction. The
                    DNA breakdown gave me clarity on what truly fits me — and
                    the confidence to move forward.
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <div
                    className="w-12 h-12 rounded-full border border-solid border-white shrink-0"
                    style={{
                      background:
                        "url(/figmaAssets/avatar-2.png) 50% 50% / cover",
                    }}
                  />
                  <div>
                    <div className="font-medium text-white text-base">
                      May Hoang
                    </div>
                    <div className="text-white text-sm">
                      Founder, The Circle Technology
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right cards */}
            <div className="flex gap-6 shrink-0">
              <Card className="flex flex-col w-[320px] items-start p-6 bg-white rounded-2xl border border-solid border-[#ededed] shadow-shadow rotate-[4deg]">
                <CardContent className="flex flex-col items-start justify-between gap-6 w-full p-0">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="font-satoshi font-[number:var(--satoshi-heading-h5-24-regular-font-weight)] text-[#101010] text-[length:var(--satoshi-heading-h5-24-regular-font-size)] tracking-[var(--satoshi-heading-h5-24-regular-letter-spacing)] leading-[var(--satoshi-heading-h5-24-regular-line-height)] [font-style:var(--satoshi-heading-h5-24-regular-font-style)]">
                      {allTestimonials[2].quote}
                    </div>
                    <div className=" text-[#878787] text-sm leading-5">
                      {allTestimonials[2].body}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{
                        background: `url(${allTestimonials[2].avatar}) 50% 50% / cover`,
                      }}
                    />
                    <div>
                      <div className="font-medium text-[#101010] text-sm">
                        {allTestimonials[2].name}
                      </div>
                      <div className="text-[#878787] text-xs">
                        {allTestimonials[2].title}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex flex-col w-[320px] items-start p-6 bg-white rounded-2xl border border-solid border-[#ededed] shadow-shadow rotate-[-4deg]">
                <CardContent className="flex flex-col items-start justify-between gap-6 w-full p-0">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="font-satoshi font-[number:var(--satoshi-heading-h5-24-regular-font-weight)] text-[#101010] text-[length:var(--satoshi-heading-h5-24-regular-font-size)] tracking-[var(--satoshi-heading-h5-24-regular-letter-spacing)] leading-[var(--satoshi-heading-h5-24-regular-line-height)] [font-style:var(--satoshi-heading-h5-24-regular-font-style)]">
                      {allTestimonials[3]?.quote}
                    </div>
                    <div className=" text-[#878787] text-sm leading-5">
                      {allTestimonials[3]?.body}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{
                        background: `url(${allTestimonials[3].avatar}) 50% 50% / cover`,
                      }}
                    />
                    <div>
                      <div className=" font-medium text-[#101010] text-sm">
                        {allTestimonials[3].name}
                      </div>
                      <div className=" text-[#878787] text-xs">
                        {allTestimonials[3].title}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
