import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function initAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    app = initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  } else {
    app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }
  return app;
}

export function getAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth;
  const a = initAdminApp();
  adminAuth = getAuth(a);
  return adminAuth ?? null;
}

export function getAdminFirestore(): Firestore {
  if (adminDb) return adminDb;
  const a = initAdminApp();
  adminDb = getFirestore(a);
  return adminDb;
}

// Re-export type so route.ts can import from one place
export type { UserProfile } from "./firestore";

export async function adminGetUserProfile(uid: string): Promise<import("./firestore").UserProfile | null> {
  const db = getAdminFirestore();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as import("./firestore").UserProfile;
}

export async function adminSaveUserProfile(
  uid: string,
  data: Partial<import("./firestore").UserProfile>,
): Promise<void> {
  const db = getAdminFirestore();
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  await db.collection("users").doc(uid).set(
    { ...clean, updatedAt: new Date().toISOString() },
    { merge: true },
  );
}

export interface AdminAssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: FirebaseFirestore.Timestamp;
  metadata?: {
    modeUsed?: string;
    stageAtTime?: string;
    commitmentExtracted?: string | null;
  };
}

export async function adminAddAssistantMessage(
  uid: string,
  message: Omit<AdminAssistantMessage, "id" | "createdAt">,
): Promise<string> {
  const db = getAdminFirestore();
  const { Timestamp } = await import("firebase-admin/firestore");
  const ref = await db
    .collection("assistantThreads")
    .doc(uid)
    .collection("messages")
    .add({ ...message, createdAt: Timestamp.now() });
  return ref.id;
}

export async function adminGetAssistantMessages(
  uid: string,
  limitCount = 20,
): Promise<AdminAssistantMessage[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection("assistantThreads")
    .doc(uid)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limit(limitCount)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminAssistantMessage, "id">) }));
}

export async function verifyAuth(
  req: NextRequest,
): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const auth = getAdminAuth();
    if (!auth) return null;
    const decoded = await auth.verifyIdToken(token);
    // Use email as the document key to match the client-side convention
    // (AuthPersistence uses firebaseUser.email || uid as appUid).
    return { uid: decoded.email ?? decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
