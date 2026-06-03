import { doc, getDoc, setDoc, deleteDoc, updateDoc, deleteField } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  age?: string;
  birthday?: string;
  occupation?: string;
  sex?: string;
  referralSource?: string;
  useCase: string;
  onboardingComplete: boolean;
  dnaAssessmentComplete?: boolean;
  fullName?: string;
  nickname?: string;
  workType?: string;
  orgId?: string;
  cvData?: {
    file_name: string;
    file_path: string;
    status: string;
    text_length: number;
  };
  cvSummary?: string;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string;
  assessmentAnswers?: Record<string, string>;
  dnaScores?: {
    risk_score: number;
    uncertainty_score: number;
    energy_stability_score: number;
    constraint_score: number;
    readiness_score: number;
    structure_score: number;
    motivation_driver: string;
    strengths_summary: string;
    non_negotiable: string;
    success_feeling: string;
    energy_source: string;
    energy_drains: string;
    // Derived text labels (added in later engine versions)
    primary_motivation?: string;
    collaboration_mode?: string;
    structure_preference?: string;
    ambiguity_tolerance?: string;
    emotional_risk?: string;
    financial_risk?: string;
    time_availability?: string;
    readiness_label?: string;
    strength_patterns?: string[];
  };
  dna_narrative?: Record<string, string>;
  directionEligibility?: {
    eligible: boolean;
    model?: string;
    reason?: string;
  };
  directionText?: string;
  directionAlternatives?: {
    model: string;
    compatibility: number;
    summary?: string;
  }[];
}

function getDb() {
  if (db) return db;
  // Try re-importing in case Firebase initialized after module load
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const firebase = require("./firebase");
    return firebase.db;
  } catch {
    return null;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getDb();
  if (!firestore) {
    console.warn("[Firestore] db not initialized, skipping getUserProfile");
    return null;
  }
  try {
    const docRef = doc(firestore, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let user = docSnap.data() as UserProfile;

      return user;
    }
    return null;
  } catch (error) {
    await auth?.signOut();
    console.error("[Firestore] Error fetching user profile:", error);
    return null;
  }
}

export async function saveUserProfile(
  uid: string,
  data: Partial<UserProfile>,
): Promise<void> {
  const firestore = getDb();
  if (!firestore) {
    console.error("[Firestore] db not initialized, cannot save profile");
    return;
  }
  try {
    console.log("[Firestore] Saving profile for uid:", uid);
    const docRef = doc(firestore, "users", uid);

    // Remove undefined values to avoid Firebase error
    const cleanData = Object.entries(data).reduce((acc: any, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const existing = await getDoc(docRef);
    if (existing.exists()) {
      await setDoc(
        docRef,
        { ...cleanData, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    } else {
      await setDoc(docRef, {
        ...cleanData,
        onboardingComplete: cleanData.onboardingComplete ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log("[Firestore] Profile saved successfully");
  } catch (error) {
    console.error("[Firestore] Error saving user profile:", error);
    throw error;
  }
}

export async function clearDownstreamProfile(uid: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  const docRef = doc(firestore, "users", uid);
  await updateDoc(docRef, {
    directionText: deleteField(),
    directionAlternatives: deleteField(),
    directionEligibility: deleteField(),
  });
}

export async function isOnboardingComplete(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  console.log("[Firestore] onboarding check for", uid);
  if (!profile) return false;
  return profile.onboardingComplete === true;
}

export async function isDNAAssessmentComplete(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  if (!profile) return false;
  return profile.dnaAssessmentComplete === true;
}

export async function saveAssessmentResults(
  uid: string,
  answers: Record<string, string>,
  eligibility: import("@/lib/dnaEngine").DirectionEligibility,
  dna_narrative?: Record<string, string>,
): Promise<void> {
  const { scores } = eligibility;
  const { rankModels } = await import("@/lib/dnaEngine");
  const ranked = eligibility.eligible ? rankModels(scores) : [];
  await saveUserProfile(uid, {
    assessmentAnswers: answers,
    dnaAssessmentComplete: true,
    dnaScores: scores,
    ...(dna_narrative ? { dna_narrative } : {}),
    directionEligibility: eligibility.eligible
      ? { eligible: true, model: eligibility.model }
      : { eligible: false, reason: eligibility.reason },
    directionAlternatives: ranked.map((r) => ({
      model: r.model,
      compatibility: r.compatibility,
    })),
  });
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) {
    console.error("[Firestore] db not initialized, cannot delete profile");
    return;
  }
  try {
    const docRef = doc(firestore, "users", uid);
    await deleteDoc(docRef);
    console.log("[Firestore] User profile deleted for uid:", uid);
  } catch (error) {
    console.error("[Firestore] Error deleting user profile:", error);
    throw error;
  }
}
