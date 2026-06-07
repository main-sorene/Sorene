import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminFirestore().collection("users").doc(user.uid).get();
  const account = snap.data()?.threadsAccount ?? null;

  if (!account?.accessToken) return Response.json({ connected: false });
  return Response.json({ connected: true, username: account.username, connectedAt: account.connectedAt });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await getAdminFirestore().collection("users").doc(user.uid).update({
    threadsAccount: FieldValue.delete(),
  });

  return Response.json({ ok: true });
}
