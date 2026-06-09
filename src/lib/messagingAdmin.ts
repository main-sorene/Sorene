import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebaseAdmin";
import { randomBytes } from "crypto";

export type MessagingPlatform = "telegram" | "whatsapp";

export interface ExecutionProgress {
  conversationsLogged: number;
  problemIdentified: boolean;
  mvoCreated: boolean;
  payingCustomers: number;
  elevatorPitch: string;
  lastCheckIn: string | null;
  weeklyStreakDays: number;
}

function getDb() {
  return getAdminFirestore();
}

export async function createLinkToken(uid: string, platform: MessagingPlatform): Promise<string> {
  const token = randomBytes(16).toString("hex");
  await getDb().collection("messagingLinkTokens").doc(token).set({
    uid,
    platform,
    used: false,
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    createdAt: Timestamp.now(),
  });
  return token;
}

export async function consumeLinkToken(token: string): Promise<{ uid: string; platform: MessagingPlatform } | null> {
  const ref = getDb().collection("messagingLinkTokens").doc(token);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (data.used) return null;
  if ((data.expiresAt as Timestamp).toDate() < new Date()) return null;
  await ref.update({ used: true });
  return { uid: data.uid, platform: data.platform };
}

export async function linkPlatformToUser(uid: string, platform: MessagingPlatform, platformId: string): Promise<void> {
  await getDb().collection("users").doc(uid).set(
    { linkedMessaging: { [platform]: platformId } },
    { merge: true }
  );
}

export async function getUidByPlatformId(platform: MessagingPlatform, platformId: string): Promise<string | null> {
  const snap = await getDb().collection("users")
    .where(`linkedMessaging.${platform}`, "==", platformId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function saveMessagingMessage(uid: string, platform: MessagingPlatform, role: "user" | "assistant", text: string): Promise<void> {
  await getDb().collection("messagingChats").doc(uid).collection("messages").add({
    platform,
    role,
    content: text,
    createdAt: Timestamp.now(),
  });
}

export async function getRecentMessages(uid: string, limit = 10): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const snap = await getDb()
    .collection("messagingChats").doc(uid).collection("messages")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.reverse().map((d) => ({ role: d.data().role, content: d.data().content }));
}

export async function getExecutionProgress(uid: string): Promise<ExecutionProgress> {
  const snap = await getDb().collection("users").doc(uid).get();
  const ep = snap.data()?.executionProgress ?? {};
  return {
    conversationsLogged: ep.conversationsLogged ?? 0,
    problemIdentified: ep.problemIdentified ?? false,
    mvoCreated: ep.mvoCreated ?? false,
    payingCustomers: ep.payingCustomers ?? 0,
    elevatorPitch: ep.elevatorPitch ?? "",
    lastCheckIn: ep.lastCheckIn ?? null,
    weeklyStreakDays: ep.weeklyStreakDays ?? 0,
  };
}

export async function updateExecutionProgress(uid: string, patch: Partial<ExecutionProgress>): Promise<void> {
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    update[`executionProgress.${k}`] = v;
  }
  await getDb().collection("users").doc(uid).set(update, { merge: true });
}

// WhatsApp credits — 1 credit per message exchange.
// Stored as `whatsappCredits` on the user doc.
// New users receive FREE_CREDITS automatically on first use.
const FREE_CREDITS = 10;

export async function getWhatsAppCredits(uid: string): Promise<number> {
  const snap = await getDb().collection("users").doc(uid).get();
  const data = snap.data();
  if (!data) return 0;
  if (typeof data.whatsappCredits === "number") return data.whatsappCredits;
  await getDb().collection("users").doc(uid).set({ whatsappCredits: FREE_CREDITS }, { merge: true });
  return FREE_CREDITS;
}

export async function deductWhatsAppCredit(uid: string): Promise<void> {
  const ref = getDb().collection("users").doc(uid);
  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.data()?.whatsappCredits as number) ?? 0;
    tx.set(ref, { whatsappCredits: Math.max(0, current - 1) }, { merge: true });
  });
}
