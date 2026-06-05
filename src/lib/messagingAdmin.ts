// Server-side messaging helpers using Firestore REST API (no firebase-admin dependency)

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

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";

function firestoreBase() {
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
}

function parseField(field: any): any {
  if (!field) return null;
  if ("stringValue" in field) return field.stringValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("timestampValue" in field) return field.timestampValue;
  return null;
}

async function firestoreGet(path: string): Promise<any | null> {
  const res = await fetch(`${firestoreBase()}/${path}`);
  if (!res.ok) return null;
  return res.json();
}

async function firestorePatch(path: string, fields: Record<string, any>): Promise<void> {
  await fetch(`${firestoreBase()}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
}

export async function consumeLinkToken(token: string): Promise<{ uid: string; platform: MessagingPlatform } | null> {
  const doc = await firestoreGet(`messagingLinkTokens/${token}`);
  if (!doc?.fields) return null;
  const used = parseField(doc.fields.used);
  const expiresAt = parseField(doc.fields.expiresAt);
  if (used) return null;
  if (expiresAt && new Date(expiresAt) < new Date()) return null;
  const uid = parseField(doc.fields.uid);
  const platform = parseField(doc.fields.platform) as MessagingPlatform;
  await firestorePatch(`messagingLinkTokens/${token}`, { used: { booleanValue: true } });
  return { uid, platform };
}

export async function getExecutionProgress(uid: string): Promise<ExecutionProgress> {
  const doc = await firestoreGet(`users/${uid}`);
  const data = doc?.fields;
  const ep = data?.executionProgress?.mapValue?.fields;
  return {
    conversationsLogged: ep?.conversationsLogged ? Number(ep.conversationsLogged.integerValue ?? 0) : 0,
    problemIdentified: ep?.problemIdentified?.booleanValue ?? false,
    mvoCreated: ep?.mvoCreated?.booleanValue ?? false,
    payingCustomers: ep?.payingCustomers ? Number(ep.payingCustomers.integerValue ?? 0) : 0,
    elevatorPitch: ep?.elevatorPitch?.stringValue ?? "",
    lastCheckIn: ep?.lastCheckIn?.stringValue ?? null,
    weeklyStreakDays: ep?.weeklyStreakDays ? Number(ep.weeklyStreakDays.integerValue ?? 0) : 0,
  };
}
