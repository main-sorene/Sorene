import { NextRequest } from "next/server";
import { getApps, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const maxDuration = 60;

const ADMIN_SECRET = process.env.ADMIN_SECRET || "sorene-admin-2024";

async function run(dryRun: boolean) {
  getAdminAuth(); // ensures Firebase Admin is initialized
  if (!getApps().length) {
    return Response.json({ error: "Firebase admin not initialized" }, { status: 500 });
  }

  const db = getFirestore(getApp());
  const usersSnap = await db.collection("users").get();
  const results: { uid: string; email?: string; status: string }[] = [];

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const uid = userDoc.id;
    const email = data.email || data.profile?.email || "";

    const hasDirectionCards = Array.isArray(data.directionCards) && data.directionCards.length > 0;

    if (!hasDirectionCards) {
      results.push({ uid, email, status: "skipped — no direction cards" });
      continue;
    }

    // Clear if: no R&C data (cards generated before R&C gate) OR cards look dummy/truncated
    const hasRC = data.resourcesConstraints &&
      Object.values(data.resourcesConstraints as Record<string, string>).some((v) => String(v ?? "").trim() !== "");
    const firstCard = data.directionCards?.[0];
    const isDummy = firstCard && (
      firstCard.title === "The Scalable Specialist" ||
      !firstCard.ikigai_filters ||
      !firstCard.path_label
    );

    if (hasRC && !isDummy) {
      results.push({ uid, email, status: "skipped — cards look valid" });
      continue;
    }

    const reason = !hasRC ? "no R&C data" : "dummy/truncated cards";
    if (!dryRun) {
      await db.collection("users").doc(uid).update({
        directionCards: FieldValue.delete(),
        directionText: FieldValue.delete(),
      });
    }
    results.push({ uid, email, status: dryRun ? `would clear (dry run — ${reason})` : `✓ cleared (${reason})` });
  }

  const cleared = results.filter((r) => r.status.startsWith("✓")).length;
  return Response.json({ total: usersSnap.size, cleared, dryRun, results });
}

// GET: dry run preview — /api/admin/clear-stale-direction-cards?secret=...
// GET with &confirm=true — actually clears
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("secret") !== ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = req.nextUrl.searchParams.get("confirm") !== "true";
  return run(dryRun);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.secret !== ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = body.confirm !== true;
  return run(dryRun);
}
