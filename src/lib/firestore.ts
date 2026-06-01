import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
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
  cvData?: {
    file_name: string;
    file_path: string;
    status: string;
    text_length: number;
  };
  createdAt: string;
  updatedAt: string;
  photoUrl?: string;
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
    console.log("[Firestore] Saving profile for uid:", uid, data);
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

export async function isOnboardingComplete(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  console.log("[Firestore] onboarding check for", uid, "profile:", profile);
  if (!profile) return false;
  return profile.onboardingComplete === true;
}

export async function isDNAAssessmentComplete(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  if (!profile) return false;
  return profile.dnaAssessmentComplete === true;
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
