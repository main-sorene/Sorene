import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { setCreditsLimit } from "@/lib/credits";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userKey, plan = "starter", duration = 1 } = await req.json();
  if (!userKey) {
    return NextResponse.json({ error: "Missing userKey" }, { status: 400 });
  }

  const db = getAdminFirestore();

  await db.collection("users").doc(userKey).set(
    {
      subscription: {
        active: true,
        plan,
        status: "active",
        duration,
        stripeSubscriptionId: "manual-grant",
      },
    },
    { merge: true },
  );

  await setCreditsLimit(userKey, plan, true);

  const snap = await db.collection("users").doc(userKey).get();
  const data = snap.data();

  return NextResponse.json({
    ok: true,
    userKey,
    plan,
    credits: data?.credits,
    subscription: data?.subscription,
  });
}
