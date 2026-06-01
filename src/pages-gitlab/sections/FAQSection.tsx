"use client";

import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: "What is Sorene?",
    answer:
      "Sorene is the first AI platform that helps career changers and aspiring entrepreneurs find, plan, and launch a business built around who they actually are. It combines psychometric assessment, AI-powered business idea generation, structured planning, execution support, and daily coaching into one platform — starting with the person, not the market.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Sorene offers a permanently free tier including Chat-based DNA Assessment, DNA Summary (in-chat overview), Structured DNA Page (basic view), Business Idea Generation, Limited Chat Interaction.",
  },
  {
    question: "How does Sorene work?",
    answer:
      "Sorene guides users through a six-stage journey:\n\n(1) Psychometric and lifestyle assessment covering personality, values, finances, and background.\n(2) Generation of a personalized Sorene DNA profile.\n(3) AI-powered business idea recommendations tailored to your profile.\n(4) A structured business plan builder.\n(5) A milestone-based execution roadmap with daily next actions (Coming features).\n(6) AI coaching check-ins, tools hub, and community access (Coming features).",
  },
  {
    question: "What is the Sorene DNA assessment?",
    answer:
      "The Sorene DNA is Sorene's proprietary user profile, generated from personality assessments, financial readiness data, lifestyle preferences, work history, and background analysis. It is the foundation of everything Sorene recommends. This is Sorene's core differentiator — the profile that competitors cannot replicate because they start at the idea stage, not the person stage.",
  },
  {
    question: "Who is Sorene designed for?",
    answer:
      "Sorene is designed for: career changers considering leaving employment; aspiring solopreneurs who want clarity on what business fits their life; freelancers and side hustlers building toward a sustainable venture; professionals affected by AI displacement and layoffs who want to build something of their own; and anyone who has tried generic business planning tools and found them impersonal or overwhelming.",
  },
  {
    question: "Is Sorene good for someone who was just laid off?",
    answer:
      "Yes. Sorene is designed to help displaced professionals reframe from necessity to opportunity — finding a business aligned with their existing skills and values, at the lowest possible starting cost. Research confirms that people who make this reframe build more sustainable businesses than those who act purely from financial pressure.",
  },
  {
    question: "How is Sorene different from using ChatGPT for business ideas?",
    answer:
      "General AI tools like ChatGPT give the same type of response to everyone. Sorene's recommendations are built on your unique Sorene DNA profile — a personalized data layer that accumulates across your entire journey. The more you use Sorene, the more tailored its guidance becomes. Generic AI has no memory of who you are. Sorene is built entirely around it.",
  },
  {
    question: "What does Sorene do with my assessment data?",
    answer:
      "Your assessment data is used exclusively to generate your Sorene DNA profile and personalize your experience. Sorene does not sell user data to third parties. Your profile belongs to you.",
  },
];

import { Plus, Minus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="flex flex-col items-center gap-12 lg:gap-20 px-5 sm:px-10 lg:px-20 py-16 lg:py-[100px] w-full bg-white">
      <div className="flex flex-col max-w-screen-xl gap-8 lg:gap-10 w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto text-center">
          <div className="font-satoshi inline-flex items-center justify-center gap-2 px-5 py-2 bg-white rounded-[40px] border border-solid border-[#EDEDED] shadow-shadow">
            Frequently <span className="text-[#FDC24C]">Asked Questions</span>
          </div>
          <h2 className="self-stretch font-normal text-[#101010] text-3xl sm:text-4xl lg:text-5xl text-center leading-tight">
            <span className="font-medium tracking-[-0.24px] block mb-2">
              Get Answers
            </span>
            <span className="font-satoshi italic tracking-[-0.48px]">
              Before You Get Started
            </span>
          </h2>
          <p className="self-stretch font-normal text-[#878787] text-base text-center tracking-[0] leading-6 max-w-3xl mx-auto">
            Are you still eager to understand how everything operates? We've
            compiled answers to the most frequently asked questions to empower
            you to launch your projects more efficiently and with greater
            confidence.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto mt-4 px-1 pb-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`group relative overflow-hidden transition-all duration-300 rounded-[20px] bg-white ${
                  isOpen
                    ? "border-[#FDC24C] border-[1.5px] shadow-yellow-shadow"
                    : "border-[#f1f1f1] border shadow-shadow"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex items-center justify-between w-full p-6 sm:p-8 text-left focus:outline-none"
                >
                  <span className="font-satoshi text-lg sm:text-xl  tracking-tight pr-8 text-[#101010]">
                    {faq.question}
                  </span>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 border-[0.5px] border-[#EDEDED] ring-1 ring-[#E5E7EB] ring-offset-1 ring-offset-white`}
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: isOpen ? 0 : 0 }} // Simplified since icons swap
                    >
                      {isOpen ? (
                        <Minus className="w-5 h-5" strokeWidth={1.5} />
                      ) : (
                        <Plus className="w-5 h-5" strokeWidth={1.5} />
                      )}
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 sm:px-8 pb-8">
                        <p className="text-[#878787] text-base leading-relaxed max-w-2xl whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
