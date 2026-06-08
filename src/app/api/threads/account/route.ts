import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [snap, userSnap] = await Promise.all([
    getAdminFirestore().doc(`users/${user.uid}/integrations/threads`).get(),
    getAdminFirestore().doc(`users/${user.uid}`).get(),
  ]);
  const account = snap.data() ?? null;
  const dna = userSnap.data()?.threadsContentDNA ?? null;

  if (!account?.accessToken) return Response.json({ connected: false, dna });
  return Response.json({ connected: true, username: account.username, connectedAt: account.connectedAt, dna });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await getAdminFirestore().doc(`users/${user.uid}/integrations/threads`).delete();

  return Response.json({ ok: true });
}
