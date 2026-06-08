export interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number;
    semiAnnual: number;
  };
  description: string;
  features: string[];
  isPopular?: boolean;
}

export const PLAN_WEIGHTS: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: {
      monthly: 0,
      semiAnnual: 0,
    },
    description:
      "Start exploring what Sorene can do great for - for exploring the essentials.",
    features: [
      "Chat-based DNA Assessment",
      "DNA Summary (in-chat overview)",
      "Structured DNA Page (basic view)",
      "Business Idea Generation",
      "Limited Chat Interaction",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: {
      monthly: 15,
      semiAnnual: 13.5,
    },
    description:
      "For creators and businesses ready to launch with faster replies and more brainpower.",
    features: [
      "Everything in Free, plus:",
      "Priority AI Processing",
      "Full Chat-based DNA Assessment",
      "Unlimited DNA Refinement",
      "Complete Strategic Direction Generation",
      "Full Direction Detail Page",
      "Actionable Execution Roadmap",
      "Bite-sized Micro-learning",
      "Ongoing Direction Updates",
      "Priority Support",
    ],
    isPopular: true,
  },
  {
    id: "pro",
    name: "Professional",
    price: {
      monthly: 49,
      semiAnnual: 44.17,
    },
    description:
      "The complete Sorene AI workspace for teams, agencies, and enterprises...",
    features: [
      "Everything in Starter, plus:",
      "Up to 5x more usage than Starter",
      "Early access to advanced Sorene features",
      "Priority access at high traffic time",
      "Dedicated 24/7 Support",
    ],
  },
];
