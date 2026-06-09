import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const slug = (t: string) => t.replace(/[.[\]#$/]/g, "_").slice(0, 80);

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const db = getAdminFirestore();
  const docId = projectTitle ? `reddit__${slug(projectTitle)}` : "reddit";
  const snap = await db.doc(`users/${user.uid}/integrations/${docId}`).get();
  const data = snap.data();
  if (!data?.accessToken) return Response.json({ connected: false });
  return Response.json({ connected: true, username: data.username, karma: data.karma, connectedAt: data.connectedAt });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const docId = projectTitle ? `reddit__${slug(projectTitle)}` : "reddit";
  await getAdminFirestore().doc(`users/${user.uid}/integrations/${docId}`).delete();
  return Response.json({ ok: true });
}
