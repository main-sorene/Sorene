import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function ensureAdminApp() {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
    } else {
      initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
    }
  }
}

export function getAdminFirestore(): Firestore {
  ensureAdminApp();
  return getFirestore();
}

export interface ExecutionProgress {
  conversationsLogged: number;
  problemIdentified: boolean;
  mvoCreated: boolean;
  payingCustomers: number;
  elevatorPitch: string;
  lastCheckIn: string | null;
  weeklyStreakDays: number;
}

const defaultProgress: ExecutionProgress = {
  conversationsLogged: 0,
  problemIdentified: false,
  mvoCreated: false,
  payingCustomers: 0,
  elevatorPitch: "",
  lastCheckIn: null,
  weeklyStreakDays: 0,
};

function randomToken(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createLinkToken(
  uid: string,
  platform: "telegram" | "whatsapp",
): Promise<string> {
  const db = getAdminFirestore();
  const token = randomToken(12);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await db.collection("messagingLinkTokens").doc(token).set({
    uid,
    platform,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
  });
  return token;
}

export async function consumeLinkToken(
  token: string,
): Promise<{ uid: string; platform: string } | null> {
  const db = getAdminFirestore();
  const ref = db.collection("messagingLinkTokens").doc(token);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.used) return null;
  if (new Date(data.expiresAt) < new Date()) return null;
  await ref.update({ used: true });
  return { uid: data.uid, platform: data.platform };
}

export async function linkPlatformToUser(
  uid: string,
  platform: "telegram" | "whatsapp",
  platformId: string,
): Promise<void> {
  const db = getAdminFirestore();
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        linkedMessaging: {
          [platform]: { platformId, linkedAt: new Date().toISOString() },
        },
      },
      { merge: true },
    );
}

export async function getUidByPlatformId(
  platform: "telegram" | "whatsapp",
  platformId: string,
): Promise<string | null> {
  const db = getAdminFirestore();
  const snap = await db
    .collection("users")
    .where(`linkedMessaging.${platform}.platformId`, "==", platformId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function saveMessagingMessage(
  uid: string,
  platform: string,
  role: "user" | "assistant",
  text: string,
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection("messagingChats").doc(uid).collection("messages").add({
    platform,
    role,
    text,
    createdAt: new Date().toISOString(),
  });
}

export async function getRecentMessages(
  uid: string,
  limit = 10,
): Promise<Array<{ role: "user" | "assistant"; text: string }>> {
  const db = getAdminFirestore();
  const snap = await db
    .collection("messagingChats")
    .doc(uid)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  const docs = snap.docs.map((d) => d.data() as { role: "user" | "assistant"; text: string });
  return docs.reverse();
}

export async function updateExecutionProgress(
  uid: string,
  patch: Partial<ExecutionProgress>,
): Promise<void> {
  const db = getAdminFirestore();
  const mapped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    mapped[`executionProgress.${k}`] = v;
  }
  await db.collection("users").doc(uid).set(
    { executionProgress: patch },
    { merge: true },
  );
}

export async function getExecutionProgress(uid: string): Promise<ExecutionProgress> {
  const db = getAdminFirestore();
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return { ...defaultProgress };
  const data = snap.data()!;
  return { ...defaultProgress, ...(data.executionProgress ?? {}) };
}
