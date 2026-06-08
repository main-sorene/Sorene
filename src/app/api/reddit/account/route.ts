import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminFirestore().doc(`users/${user.uid}/integrations/reddit`).get();
  const data = snap.data();
  if (!data?.accessToken) return Response.json({ connected: false });
  return Response.json({ connected: true, username: data.username, karma: data.karma, connectedAt: data.connectedAt });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await getAdminFirestore().doc(`users/${user.uid}/integrations/reddit`).delete();
  return Response.json({ ok: true });
}
