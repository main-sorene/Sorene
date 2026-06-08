import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ connected: false }, { status: 401 });

  const db = getAdminFirestore();
  const snap = await db.doc(`users/${user.uid}/integrations/threads`).get();
  if (!snap.exists) return Response.json({ connected: false });

  const data = snap.data() as { username?: string; profilePictureUrl?: string; expiresAt?: number };
  const expired = data.expiresAt ? Date.now() > data.expiresAt : false;

  return Response.json({
    connected: !expired,
    username: data.username ?? "",
    profilePictureUrl: data.profilePictureUrl ?? "",
  });
}
