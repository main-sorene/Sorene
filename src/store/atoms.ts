import { atom } from "jotai";
import { UserProfile } from "@/lib/firestore";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  profile?: UserProfile;
}

export const userAtom = atom<AuthUser | null>(null);
export const authLoadingAtom = atom<boolean>(true);

export const activeNavAtom = atom<string>("Home");

export const billingYearlyAtom = atom<boolean>(true);

export const emailInputAtom = atom<string>("");

export const activeStepAtom = atom<number>(0);

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  done?: boolean;
  type?: "chat" | "psychometric";
  isHidden?: boolean;
  attachedFileName?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  nquestion?: number;
  done?: boolean;
  segment?: string;
  isCreatedOnBackend?: boolean;
}

export type AIModel = {
  id: string;
  name: string;
  description: string;
};

export const MODELS: AIModel[] = [
  { id: "sorene-1", name: "Sorene 1.0", description: "Most capable" },
  {
    id: "sorene-1-mini",
    name: "Sorene 1.0 Mini",
    description: "Faster & lighter",
  },
  { id: "sorene-lite", name: "Sorene Lite", description: "Balanced" },
];

export const conversationsAtom = atom<Conversation[]>([]);

export const activeConversationIdAtom = atom<string | null>(null);

export const activeConversationAtom = atom((get) => {
  const id = get(activeConversationIdAtom);
  const convs = get(conversationsAtom);
  return convs.find((c) => c.id === id) ?? null;
});

export const selectedModelAtom = atom<AIModel>(MODELS[0]);

export const sidebarOpenAtom = atom<boolean>(false);

export const isSendingAtom = atom<boolean>(false);

export const inputValueAtom = atom<string>("");

export const cvTextAtom = atom<string | null>(null);
export const isSettingsOpenAtom = atom<boolean>(false);
export const settingsTabAtom = atom<string>("General");
export const isLogoutConfirmOpenAtom = atom<boolean>(false);
export const isCancelSubscriptionOpenAtom = atom<boolean>(false);
export const isManagePaymentOpenAtom = atom<boolean>(false);
export const isHistoryLoadingAtom = atom<boolean>(false);
export const isAddMoreInfoModeAtom = atom<boolean>(false);
export const isAssessmentCompleteAtom = atom<boolean>(false);
export interface IdeationIdea {
  difficulty: string;
  first_validation_step: string;
  fit_score: number;
  name: string;
  risks: string[];
  summary: string;
  type: string;
  validation_metric: string;
  why_fit: string[];
  why_now: string[];
}

export interface IdeationData {
  ideation: {
    best_pick: {
      name: string;
      reason: string;
    };
    top_ideas: IdeationIdea[];
  };
  status: string;
  user_id: string;
}

export const ideationAtom = atom<IdeationData | null>(null);

export interface SubscriptionStatus {
  active: boolean;
  duration: number;
  plan: string;
  status: string;
}

export const subscriptionStatusAtom = atom<SubscriptionStatus | null>(null);

export interface RecipeDirection {
  id: string;
  title: string;
  description: string;
  whyFitsYou: string[];
  keyRisks: string[];
  firstStep: string;
  score: number;
}

function loadRecipeDirections(): RecipeDirection[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("recipeDirections");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export const recipeDirectionsAtom = atom<RecipeDirection[]>(loadRecipeDirections());
