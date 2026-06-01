import { useSetAtom } from "jotai";
import { inputValueAtom, activeConversationIdAtom } from "@/store/atoms";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  PenLine,
  BarChart2,
  Globe,
  Lightbulb,
  BookOpen,
  Camera,
  Music,
  Calculator,
  Dumbbell,
  Briefcase,
  Heart,
} from "lucide-react";

const categories = [
  {
    icon: Code2,
    label: "Coding",
    color: "text-blue-500",
    bg: "bg-blue-50",
    prompts: [
      "Debug this Python code for me",
      "Explain the difference between REST and GraphQL",
      "Write a React component for a data table",
    ],
  },
  {
    icon: PenLine,
    label: "Writing",
    color: "text-green-500",
    bg: "bg-green-50",
    prompts: [
      "Write a blog post about AI in 2025",
      "Help me improve this paragraph",
      "Create a compelling product description",
    ],
  },
  {
    icon: BarChart2,
    label: "Analysis",
    color: "text-purple-500",
    bg: "bg-purple-50",
    prompts: [
      "Analyze the pros and cons of remote work",
      "Summarize this market research",
      "Compare these two business strategies",
    ],
  },
  {
    icon: Globe,
    label: "Translation",
    color: "text-orange-500",
    bg: "bg-orange-50",
    prompts: [
      "Translate to Spanish: Hello, how are you?",
      "Translate this email to French",
      "What does 'kawaii' mean in Japanese?",
    ],
  },
  {
    icon: Lightbulb,
    label: "Brainstorm",
    color: "text-amber-500",
    bg: "bg-amber-50",
    prompts: [
      "Give me 10 startup ideas for 2025",
      "Brainstorm names for my new app",
      "What are creative ways to market my product?",
    ],
  },
  {
    icon: BookOpen,
    label: "Learning",
    color: "text-teal-500",
    bg: "bg-teal-50",
    prompts: [
      "Explain machine learning like I'm 10",
      "What is blockchain technology?",
      "How does the human immune system work?",
    ],
  },
  {
    icon: Briefcase,
    label: "Business",
    color: "text-slate-500",
    bg: "bg-slate-50",
    prompts: [
      "Write a business plan outline",
      "Draft a professional email",
      "How to negotiate a salary raise?",
    ],
  },
  {
    icon: Heart,
    label: "Wellness",
    color: "text-pink-500",
    bg: "bg-pink-50",
    prompts: [
      "Give me a 7-day meal plan",
      "How to reduce stress at work?",
      "Morning routine for productivity",
    ],
  },
];

export function ExplorePage() {
  const setInput = useSetAtom(inputValueAtom);
  const setActiveId = useSetAtom(activeConversationIdAtom);
  const navigate = useNavigate();

  const handlePrompt = (prompt: string) => {
    setActiveId(null);
    setInput(prompt);
    navigate("/chat");
  };

  return (
    <div className="flex-1 overflow-auto px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
      <h1
        className="text-2xl font-semibold text-[#151515] mb-1"
        style={{ fontFamily: "Satoshi, Helvetica" }}
        data-testid="explore-heading"
      >
        Explore
      </h1>
      <p className="text-sm text-[#9B9B9B] mb-8">
        Discover what Sorene can do for you
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.label}
            className="rounded-2xl border border-[#E8E5F0] bg-white p-5"
            data-testid={`explore-category-${cat.label.toLowerCase()}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center`}
              >
                <cat.icon size={20} className={cat.color} />
              </div>
              <h3 className="font-semibold text-[#151515] text-sm">
                {cat.label}
              </h3>
            </div>
            <div className="space-y-2">
              {cat.prompts.map((prompt) => (
                <button
                  key={prompt}
                  data-testid={`explore-prompt-${prompt.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => handlePrompt(prompt)}
                  className="w-full text-left text-xs text-[#6B6B6B] px-3 py-2 rounded-xl bg-[#F7F6FA] hover:bg-[#EDE8F7] hover:text-[#8A38F5] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
