import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminFirestore().collection("users").doc(user.uid).get();
  const settings = snap.data()?.whatsappSettings ?? {};
  return Response.json({ settings });
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  await getAdminFirestore().collection("users").doc(user.uid).set(
    { whatsappSettings: body },
    { merge: true }
  );
  return Response.json({ success: true });
}
