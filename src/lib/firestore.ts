import { doc, getDoc, setDoc, deleteDoc, updateDoc, deleteField, collection, getDocs, addDoc, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { DirectionCardData } from "./directionTypes";
import type { Conversation } from "@/store/atoms";

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
    quit_reason: string;
    // Derived text labels
    primary_motivation?: string;
    collaboration_mode?: string;
    structure_preference?: string;
    ambiguity_tolerance?: string;
    emotional_risk?: string;
    financial_risk?: string;
    time_availability?: string;
    readiness_label?: string;
    strength_patterns?: string[];
    // Coaching identity labels — generated async via /api/dna-labels after assessment
    value_signature?: string;
    hidden_strength?: string;
  };
  dna_narrative?: Record<string, string>;
  directionEligibility?: {
    eligible: boolean;
    model?: string;
    reason?: string;
    escalation?: {
      trigger: string;
      message: string;
      topCompatibility: number;
    };
  };
  escalationLog?: {
    trigger: string;
    topCompatibility: number;
    timestamp: string;
  };
  directionText?: string;
  directionAlternatives?: {
    model: string;
    compatibility: number;
    summary?: string;
  }[];
  directionCards?: DirectionCardData[];
  resourcesConstraints?: Record<string, string>;
  mieReport?: unknown;
  mieReportGeneratedAt?: string;
  problemScanReport?: unknown;
  problemScanReportGeneratedAt?: string;

  // ── Coaching layer ─────────────────────────────────────────────────────────
  coachingStage?: 'lost' | 'exploring' | 'testing' | 'earning' | 'stabilizing';
  firstSessionComplete?: boolean;
  lastSessionAt?: string;
  directionRationale?: string;

  // State memory — updated each session
  stateMemory?: {
    emotion?: string;
    energyLevel?: 'low' | 'medium' | 'high';
    clarityLevel?: 'confused' | 'exploring' | 'clear';
    updatedAt?: string;
  };

  // Behavior memory — the moat
  behaviorMemory?: {
    experimentsCompleted?: number;
    experimentsAbandoned?: number;
    customerConversations?: number;
    lastCommitment?: string;
    lastCommitmentKept?: boolean | null;
    pivotSignalsTriggered?: number;
    firstMoneyReceivedAt?: string | null;
  };

  // Execution Hub
  executionStage?: string;
  launchpadItemsCompleted?: string[];
  activeGrowthStrategies?: string[];

  // Education Module
  educationProgress?: {
    currentBlock?: number;
    completedBlocks?: number[];
    microExperimentsCompleted?: string[];
    startedAt?: string;
    lastActivityAt?: string;
  };

  // Business Status
  businessStatusEnabled?: boolean;
  trackedMetrics?: string[];
  metricCadence?: 'daily' | 'weekly' | 'monthly' | 'on_request';
  metricCadenceDay?: string;

  // Preferences (consolidated — includes WhatsApp; old top-level whatsapp fields deprecated)
  preferences?: {
    language?: string;
    timezone?: string;
    checkinCadence?: 'daily' | 'weekly' | 'monthly' | 'off';
    checkinDay?: string;
    checkinTime?: string;
    pushNotifications?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    // WhatsApp — mirrors linkedMessaging.whatsapp; kept in sync on connect/disconnect
    whatsappConnected?: boolean;
    whatsappNumber?: string;
  };
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
    // Do NOT sign the user out here — a transient/slow read would otherwise
    // log them out and bounce them back to the landing page.
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
  const directionEligibility =
    eligibility.eligible === true
      ? { eligible: true as const, model: eligibility.model }
      : { eligible: false as const, reason: eligibility.reason };
  await saveUserProfile(uid, {
    assessmentAnswers: answers,
    dnaAssessmentComplete: true,
    dnaScores: scores,
    ...(dna_narrative ? { dna_narrative } : {}),
    directionEligibility,
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

// ── Cross-device conversation history ────────────────────────────────────────
// Local-only chats (assessment, DNA, Direction) live in localStorage, which is
// per-device. We mirror them to a per-user Firestore subcollection so the
// sidebar history follows the user across devices. Each conversation is stored
// as a single JSON blob (one doc per conversation) to stay well under the
// per-document size limit and avoid Date/nested-object serialization pitfalls.

const CONVERSATIONS = "conversations";

function reviveConversation(raw: any): Conversation | null {
  if (!raw?.id) return null;
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    messages: Array.isArray(raw.messages)
      ? raw.messages.map((m: any) => ({ ...m, timestamp: m?.timestamp ? new Date(m.timestamp) : new Date() }))
      : [],
  } as Conversation;
}

export async function getCloudConversations(uid: string): Promise<Conversation[]> {
  const firestore = getDb();
  if (!firestore) return [];
  try {
    const snap = await getDocs(collection(firestore, "users", uid, CONVERSATIONS));
    const out: Conversation[] = [];
    snap.forEach((d) => {
      const data = d.data() as { json?: string };
      if (!data?.json) return;
      try {
        const revived = reviveConversation(JSON.parse(data.json));
        if (revived) out.push(revived);
      } catch {}
    });
    return out;
  } catch (error) {
    console.error("[Firestore] Error loading cloud conversations:", error);
    return [];
  }
}

export async function saveCloudConversation(uid: string, conv: Conversation): Promise<void> {
  const firestore = getDb();
  if (!firestore || !conv?.id) return;
  try {
    await setDoc(doc(firestore, "users", uid, CONVERSATIONS, conv.id), {
      json: JSON.stringify(conv),
      segment: conv.segment ?? "",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Firestore] Error saving cloud conversation:", error);
  }
}

export async function deleteCloudConversation(uid: string, convId: string): Promise<void> {
  const firestore = getDb();
  if (!firestore || !convId) return;
  try {
    await deleteDoc(doc(firestore, "users", uid, CONVERSATIONS, convId));
  } catch (error) {
    console.error("[Firestore] Error deleting cloud conversation:", error);
  }
}

export async function clearCloudConversations(uid: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  try {
    const snap = await getDocs(collection(firestore, "users", uid, CONVERSATIONS));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  } catch (error) {
    console.error("[Firestore] Error clearing cloud conversations:", error);
  }
}

// ── Subcollection types ───────────────────────────────────────────────────────

export interface AssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Timestamp;
  metadata?: {
    modeUsed?: 'onboarding' | 'reflection' | 'direction' | 'execution';
    stageAtTime?: string;
    commitmentExtracted?: string | null;
  };
}

export interface ExecutionEntity {
  entityType: 'customer_call' | 'commitment' | 'decision' | 'blocker' | 'first_money';
  summary: string;
  sourceTab: 'assistant' | 'customer_research' | 'outreach' | 'launchpad';
  confirmed: boolean;
  completed: boolean | null;
  createdAt: Timestamp;
}

export interface BusinessMetricEntry {
  metricType: string;
  platform: string;
  value: number;
  delta: number;
  periodType: 'daily' | 'weekly' | 'monthly' | 'manual';
  notes: string;
  recordedAt: Timestamp;
}

export interface PivotSignalEvent {
  signalType: string;
  experimentCount: number;
  conversationCount: number;
  surfacedAt: Timestamp;
  userResponse?: string;
  createdAt: Timestamp;
}

export interface NudgeLogEntry {
  channel: string;
  triggerType: string;
  sentAt: Timestamp;
  opened?: boolean;
}

// ── assistantThreads/{uid}/messages ──────────────────────────────────────────

export async function addAssistantMessage(
  uid: string,
  message: Omit<AssistantMessage, 'createdAt'>,
): Promise<string> {
  const firestore = getDb();
  if (!firestore) throw new Error('[Firestore] db not initialized');
  const ref = await addDoc(
    collection(firestore, 'assistantThreads', uid, 'messages'),
    { ...message, createdAt: Timestamp.now() },
  );
  return ref.id;
}

export async function getAssistantMessages(
  uid: string,
  limitCount = 50,
): Promise<(AssistantMessage & { id: string })[]> {
  const firestore = getDb();
  if (!firestore) return [];
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'assistantThreads', uid, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(limitCount),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AssistantMessage) }));
  } catch (error) {
    console.error('[Firestore] Error loading assistant messages:', error);
    return [];
  }
}

export async function clearAssistantThread(uid: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  const snap = await getDocs(collection(firestore, 'assistantThreads', uid, 'messages'));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

// ── executionEntities/{uid}/items ─────────────────────────────────────────────

export async function addExecutionEntity(
  uid: string,
  entity: Omit<ExecutionEntity, 'createdAt'>,
): Promise<string> {
  const firestore = getDb();
  if (!firestore) throw new Error('[Firestore] db not initialized');
  const ref = await addDoc(
    collection(firestore, 'executionEntities', uid, 'items'),
    { ...entity, createdAt: Timestamp.now() },
  );
  return ref.id;
}

export async function getExecutionEntities(
  uid: string,
): Promise<(ExecutionEntity & { id: string })[]> {
  const firestore = getDb();
  if (!firestore) return [];
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'executionEntities', uid, 'items'),
        orderBy('createdAt', 'desc'),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ExecutionEntity) }));
  } catch (error) {
    console.error('[Firestore] Error loading execution entities:', error);
    return [];
  }
}

export async function updateExecutionEntity(
  uid: string,
  itemId: string,
  patch: Partial<Omit<ExecutionEntity, 'createdAt'>>,
): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  await updateDoc(doc(firestore, 'executionEntities', uid, 'items', itemId), patch as Record<string, unknown>);
}

export async function deleteExecutionEntity(uid: string, itemId: string): Promise<void> {
  const firestore = getDb();
  if (!firestore) return;
  await deleteDoc(doc(firestore, 'executionEntities', uid, 'items', itemId));
}

// ── businessMetrics/{uid}/entries ─────────────────────────────────────────────

export async function addBusinessMetric(
  uid: string,
  entry: Omit<BusinessMetricEntry, 'recordedAt'>,
): Promise<string> {
  const firestore = getDb();
  if (!firestore) throw new Error('[Firestore] db not initialized');
  const ref = await addDoc(
    collection(firestore, 'businessMetrics', uid, 'entries'),
    { ...entry, recordedAt: Timestamp.now() },
  );
  return ref.id;
}

export async function getBusinessMetrics(
  uid: string,
  limitCount = 100,
): Promise<(BusinessMetricEntry & { id: string })[]> {
  const firestore = getDb();
  if (!firestore) return [];
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'businessMetrics', uid, 'entries'),
        orderBy('recordedAt', 'desc'),
        limit(limitCount),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as BusinessMetricEntry) }));
  } catch (error) {
    console.error('[Firestore] Error loading business metrics:', error);
    return [];
  }
}

// ── pivotSignals/{uid}/events ──────────────────────────────────────────────────

export async function addPivotSignal(
  uid: string,
  event: Omit<PivotSignalEvent, 'createdAt'>,
): Promise<string> {
  const firestore = getDb();
  if (!firestore) throw new Error('[Firestore] db not initialized');
  const ref = await addDoc(
    collection(firestore, 'pivotSignals', uid, 'events'),
    { ...event, createdAt: Timestamp.now() },
  );
  return ref.id;
}

export async function getPivotSignals(
  uid: string,
): Promise<(PivotSignalEvent & { id: string })[]> {
  const firestore = getDb();
  if (!firestore) return [];
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'pivotSignals', uid, 'events'),
        orderBy('createdAt', 'desc'),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as PivotSignalEvent) }));
  } catch (error) {
    console.error('[Firestore] Error loading pivot signals:', error);
    return [];
  }
}

// ── nudgeLog/{uid}/sent ────────────────────────────────────────────────────────

export async function logNudge(
  uid: string,
  nudge: Omit<NudgeLogEntry, 'sentAt'>,
): Promise<string> {
  const firestore = getDb();
  if (!firestore) throw new Error('[Firestore] db not initialized');
  const ref = await addDoc(
    collection(firestore, 'nudgeLog', uid, 'sent'),
    { ...nudge, sentAt: Timestamp.now() },
  );
  return ref.id;
}

export async function getNudgeLog(
  uid: string,
  limitCount = 100,
): Promise<(NudgeLogEntry & { id: string })[]> {
  const firestore = getDb();
  if (!firestore) return [];
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'nudgeLog', uid, 'sent'),
        orderBy('sentAt', 'desc'),
        limit(limitCount),
      ),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as NudgeLogEntry) }));
  } catch (error) {
    console.error('[Firestore] Error loading nudge log:', error);
    return [];
  }
}
