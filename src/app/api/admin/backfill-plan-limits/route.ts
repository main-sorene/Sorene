import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { PLAN_CREDITS } from "@/lib/credits";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret") || req.nextUrl.searchParams.get("secret");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdminFirestore();
  const snapshot = await db.collection("users").get();

  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const sub = data.subscription;
    const plan: string = sub?.active ? (sub.plan ?? "free") : "free";
    const newLimit = PLAN_CREDITS[plan] ?? PLAN_CREDITS.free;
    const currentLimit: number = data.credits?.limit ?? 0;

    // Only update if limit has changed
    if (currentLimit === newLimit) { skipped++; continue; }

    await doc.ref.set(
      { credits: { limit: newLimit } },
      { mergeFields: ["credits.limit"] },
    );
    updated++;
  }

  return NextResponse.json({ ok: true, updated, skipped });
}
