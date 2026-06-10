import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { PLAN_CREDITS } from "@/lib/credits";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userKey } = await req.json();
  if (!userKey) {
    return NextResponse.json({ error: "Missing userKey" }, { status: 400 });
  }

  const db = getAdminFirestore();

  await db.collection("users").doc(userKey).set(
    {
      subscription: {
        active: false,
        plan: "free",
        status: "inactive",
      },
      credits: {
        used: 0,
        limit: PLAN_CREDITS.free,
        extra: 0,
        reset_at: 0,
      },
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true, userKey, plan: "free", creditsLimit: PLAN_CREDITS.free });
}
