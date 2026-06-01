import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const commitmentItems = [
  {
    title: "Transparency",
    content:
      "We will tell you when AI is generating content and will not hide its limitations from you.",
  },
  {
    title: "Human judgment first",
    content:
      "Sorene is designed to support your thinking, not replace it. You are always the decision-maker.",
  },
  {
    title: "Ongoing improvement",
    content:
      "We actively work to reduce bias, improve accuracy, and update guidance as our AI evolves.",
  },
  {
    title: "Data control",
    content:
      "You own your profile. You can view, correct, or delete your data at any time, no questions asked.",
  },
];

function WhatThisMeansBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
      <p className="text-green-800 text-sm font-semibold mb-1">
        What this means for you:
      </p>
      <p className="text-green-700 text-sm">{children}</p>
    </div>
  );
}

export default function ResponsibleAIPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen w-full bg-white items-center">
      <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="p-6 h-16">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1006px] px-6 py-16">
        {/* Hero */}
        <div className="flex justify-center border-b border-neutral-100 pb-16 mb-16">
          <div className="text-center">
            <h1 className="mb-6 text-[48px] lg:text-[64px] font-semibold text-neutral-900 tracking-tight">
              Sorene AI
            </h1>
            <p className="text-[20px] font-medium text-neutral-900 text-start leading-7 max-w-[920px] mx-auto mb-6">
              What Sorene might get wrong—and what we're doing about it
            </p>
            <p className="text-neutral-500 text-[18px] text-start leading-7 max-w-[920px] mx-auto">
              Sorene uses AI to help you find and build a business aligned with
              who you are. That's a meaningful responsibility. We want you to
              understand exactly how our AI can fall short—ethically and
              practically—so you can use it with clear eyes.
            </p>
            <p className="mt-6 text-neutral-500 text-[18px] text-start leading-7 max-w-[920px] mx-auto">
              Sorene's AI is a thinking partner, not a decision-maker. Every
              business idea, plan, and recommendation it generates should be
              treated as a starting point for your own research and judgment—not
              a final answer. This page exists because we believe honesty builds
              more trust than silence.
            </p>
          </div>
        </div>

        {/* Limitations */}
        <div className="space-y-16 text-left">
          <h2 className="text-[32px] font-bold text-neutral-900 tracking-tight pt-8">
            LIMITATIONS YOU SHOULD KNOW ABOUT
          </h2>

          <article>
            <h3 className="mb-4 text-[24px] font-semibold text-[#101010]">
              1. Sorene can produce confident answers that are incorrect
            </h3>
            <div className="text-[#878787] text-base leading-7">
              <p>
                Like all AI systems, Sorene can sometimes generate information
                that sounds authoritative but is factually wrong or outdated.
                This is sometimes called "hallucination." It can happen with
                market data, business statistics, competitor information, or
                regulatory details—especially in fast-moving industries or
                regional contexts.
              </p>
              <WhatThisMeansBox>
                Do not rely on Sorene as your only source for any high-stakes
                fact—especially financial projections, legal requirements, or
                industry benchmarks. Cross-check important claims with official
                sources before acting on them.
              </WhatThisMeansBox>
            </div>
          </article>

          <article>
            <h3 className="mb-4 text-[24px] font-semibold text-[#101010]">
              2. Business ideas may reflect AI bias, not just your reality
            </h3>
            <div className="text-[#878787] text-base leading-7">
              <p>
                Sorene generates business ideas by matching your Sorene DNA
                profile against patterns in its training data. That training
                data reflects the world as it has been recorded—which means it
                may over-represent certain industries, demographics,
                geographies, and types of "successful" businesses.
              </p>
              <p className="mt-4">
                If you come from an underrepresented background, a non-Western
                market, or a profession not well-documented online, the AI's
                suggestions may feel less relevant or even subtly misaligned.
                It may default to familiar business models rather than
                genuinely novel ones suited to your context.
              </p>
              <WhatThisMeansBox>
                Treat idea suggestions as a prompt for your own thinking, not a
                comprehensive picture. If a suggestion doesn't resonate, push
                back—tell Sorene why, and explore alternatives. Your lived
                context is always more accurate than the AI's assumptions.
              </WhatThisMeansBox>
            </div>
          </article>

          <article>
            <h3 className="mb-4 text-[24px] font-semibold text-[#101010]">
              3. Your psychometric profile is a starting point, not a fixed
              truth
            </h3>
            <div className="text-[#878787] text-base leading-7">
              <p>
                The Sorene DNA assessment draws on frameworks like Ikigai and
                personality research to build a picture of who you are. This
                profile shapes every recommendation you receive. But no
                assessment can fully capture a person. You may answer
                differently on a different day, in a different mood, or at a
                different stage of life.
              </p>
              <p className="mt-4">
                Using an incomplete or inaccurate profile as the basis for
                major life and business decisions carries real risk. The AI
                does not know what it doesn't know about you—it can only work
                with what you've shared.
              </p>
              <WhatThisMeansBox>
                Review and update your profile over time. If Sorene's
                recommendations feel off, the profile may be the reason. You
                can always retake assessments or correct details. Your profile
                is a living document, not a verdict.
              </WhatThisMeansBox>
            </div>
          </article>

          <article>
            <h3 className="mb-4 text-[24px] font-semibold text-[#101010]">
              4. Sorene does not replace professional financial or legal advice
            </h3>
            <div className="text-[#878787] text-base leading-7">
              <p>
                Sorene can help you build a business plan, model revenue
                projections, and think through your financial readiness. But it
                is not a licensed financial advisor, accountant, or lawyer.
                Advice on how to structure your company, manage taxes, comply
                with local regulations, or raise investment capital requires
                professionals who understand your specific situation and
                jurisdiction.
              </p>
              <p className="mt-4">
                Acting on Sorene's guidance alone for high-stakes financial or
                legal decisions could lead to real harm—not because the AI
                intends to mislead you, but because it lacks the context,
                credentials, and accountability that professionals provide.
              </p>
              <WhatThisMeansBox>
                Use Sorene to think, draft, and explore. Before signing
                contracts, filing registrations, or making significant
                financial commitments, consult a qualified professional in your
                country.
              </WhatThisMeansBox>
            </div>
          </article>

          <article>
            <h3 className="mb-4 text-[24px] font-semibold text-[#101010]">
              5. Sorene may reflect the optimism bias of entrepreneurship
              content
            </h3>
            <div className="text-[#878787] text-base leading-7">
              <p>
                A significant portion of the content the AI was trained on
                comes from entrepreneurship communities, success stories, and
                business media—all of which tend to emphasise upside. This can
                mean Sorene's tone skews optimistic. It may underweight failure
                rates, underestimate how long things take, or frame challenges
                as manageable when they are genuinely difficult.
              </p>
              <p className="mt-4">
                For someone making a real decision about leaving employment or
                investing savings, an overly optimistic AI can do harm by
                reinforcing wishful thinking rather than grounding it.
              </p>
              <WhatThisMeansBox>
                When Sorene presents a path forward, actively ask it for the
                risks, the obstacles, and the realistic downsides. Prompting
                for honest critique produces better guidance than accepting the
                first positive response.
              </WhatThisMeansBox>
            </div>
          </article>

          <article>
            <h3 className="mb-4 text-[24px] font-semibold text-[#101010]">
              6. Your personal data is used to personalise your experience
            </h3>
            <div className="text-[#878787] text-base leading-7">
              <p>
                Sorene's value comes from understanding you over time—your
                values, financial situation, work history, and goals. This
                means we hold personal data that is meaningful and sensitive.
                We take that responsibility seriously. Your data is used to
                improve your Sorene experience and is never sold to third
                parties.
              </p>
              <p className="mt-4">
                However, no system is without risk. We are transparent about
                what we collect, how we use it, and how you can delete it.
              </p>
              <WhatThisMeansBox>
                You control your data. Review our Privacy Policy at{" "}
                <a
                  href="/privacy-policy"
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  sorene.ai/privacy
                </a>{" "}
                to understand what we collect and your rights. You can request
                deletion of your profile at any time by contacting{" "}
                <a
                  href="mailto:contact@sorene.ai"
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  contact@sorene.ai
                </a>
                .
              </WhatThisMeansBox>
            </div>
          </article>
        </div>

        {/* Commitments */}
        <h2 className="text-[32px] font-bold my-6">OUR COMMITMENTS TO YOU</h2>
        <div className="border rounded-xl overflow-hidden mb-16">
          <table className="w-full">
            <tbody>
              {commitmentItems.map((item, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="bg-green-50 text-green-900 font-semibold p-5 w-1/3 align-top">
                    {item.title}
                  </td>
                  <td className="p-5 text-gray-700">{item.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feedback */}
        <h2 className="text-[32px] font-bold my-6">
          DID SORENE GIVE YOU A RESPONSE THAT FELT WRONG OR HARMFUL?
        </h2>
        <p className="text-[#878787] text-base leading-7 whitespace-pre-line">
          We want to know. Every report helps us make Sorene more accurate and
          more ethical. You can flag a specific response inside the platform, or
          write to us directly at contact@sorene.ai.
        </p>
        <p className="text-[#878787] text-base leading-7 whitespace-pre-line">
          Your feedback shapes how we improve. We read every message.
        </p>
      </main>

      <footer className="w-full max-w-[1006px] px-6 py-12 border-t border-neutral-100 text-center">
        <p className="text-sm text-neutral-400">
          © {new Date().getFullYear()} Sorene AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
