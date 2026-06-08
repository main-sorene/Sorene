import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

const slug = (t: string) => t.replace(/[.[\]#$/]/g, "_").slice(0, 80);

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const db = getAdminFirestore();

  // Determine which integration doc to read: namespaced if project provided, fallback to legacy
  const docId = projectTitle ? `threads__${slug(projectTitle)}` : "threads";
  const [snap, fallbackSnap, userSnap] = await Promise.all([
    db.doc(`users/${user.uid}/integrations/${docId}`).get(),
    projectTitle ? db.doc(`users/${user.uid}/integrations/threads`).get() : Promise.resolve(null),
    db.doc(`users/${user.uid}`).get(),
  ]);

  // Use namespaced doc if it has data, otherwise fall back to legacy doc (backwards compat)
  const account = (snap.data() ?? (fallbackSnap?.data())) ?? null;
  const userData = userSnap.data();
  const dnaKey = projectTitle ? `threadsContentDNA__${slug(projectTitle)}` : "threadsContentDNA";
  const dna = userData?.[dnaKey] ?? null;

  if (!account?.accessToken) return Response.json({ connected: false, dna });
  return Response.json({ connected: true, username: account.username, connectedAt: account.connectedAt, dna });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const docId = projectTitle ? `threads__${slug(projectTitle)}` : "threads";

  await getAdminFirestore().doc(`users/${user.uid}/integrations/${docId}`).delete();

  return Response.json({ ok: true });
}
