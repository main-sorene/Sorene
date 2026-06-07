import { atom } from "jotai";
import { UserProfile } from "@/lib/firestore";
import type { DirectionCardData } from "@/lib/directionTypes";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  profile?: UserProfile;
}

export const userAtom = atom<AuthUser | null>(null);
export const authLoadingAtom = atom<boolean>(true);

// Bumped to kick off the "Create My Project" onboarding conversation in the
// Execution Hub chat (assess name + status, then route the user to the right tab).
export const executionOnboardTriggerAtom = atom<number>(0);

// Set by the onboarding chat to navigate the Execution Hub to a specific tab
// (e.g. after evaluation the user clicks "Yes" to go to Validation/Launchpad/Growth).
export const executionNavigateTabAtom = atom<string | null>(null);

// Set by the onboarding chat when the user clicks "Start Validate" — the Hub
// creates a project with this name/oneliner, selects it in the project bar, and
// opens the Validation tab.
export const executionStartValidateAtom = atom<{ title: string; oneliner: string } | null>(null);

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
export const isCreditsExhaustedOpenAtom = atom<boolean>(false);
export const isHistoryLoadingAtom = atom<boolean>(false);
export const isAddMoreInfoModeAtom = atom<boolean>(false);
export const isAssessmentCompleteAtom = atom<boolean>(false);
// True while AssessmentChatPage is mounted and the user hasn't clicked "Explore My DNA".
// Used by auto-flip guards so a mid-assessment Firestore save can't prematurely
// switch the page to HomePage before the button is visible.
export const isAssessmentInProgressAtom = atom<boolean>(false);
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
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  credits?: { used: number; limit: number; extra?: number; resetAt?: number };
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
  rawContent?: string;
  // Structured staged-flow card (new path). When present, the card renders with
  // the same template + lazy-loaded sections as the main direction cards.
  cardData?: DirectionCardData;
  // The brainstormed idea + transcript used to seed the staged phases.
  concept?: string;
  // True while the API call is in-flight; renders a skeleton card placeholder.
  loading?: boolean;
}

export const recipeDirectionsAtom = atom<RecipeDirection[]>([]);
// Set to the ID of a newly-added recipe card so DirectionSection can auto-expand it
export const newRecipeCardIdAtom = atom<string | null>(null);

export interface ResourcesConstraints {
  networks: string;
  startingCapital: string;
  financialRunway: string;
  hoursPerWeek: string;
  locationFlexibility: string;
  familyCommitments: string;
  incomeFloor: string;
  onlineVsOffline: string;
  growthAmbition: string;
  clientInteraction: string;
  travelTolerance: string;
  otherNotes: string;
}

export const EMPTY_RESOURCES: ResourcesConstraints = {
  networks: "", startingCapital: "", financialRunway: "", hoursPerWeek: "",
  locationFlexibility: "", familyCommitments: "", incomeFloor: "",
  onlineVsOffline: "", growthAmbition: "", clientInteraction: "",
  travelTolerance: "", otherNotes: "",
};

export const resourcesConstraintsAtom = atom<ResourcesConstraints>(EMPTY_RESOURCES);

export const selectedExecutionProjectAtom = atom<DirectionCardData | null>(null);
