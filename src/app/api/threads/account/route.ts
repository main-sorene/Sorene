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
  const [snap, userSnap] = await Promise.all([
    db.doc(`users/${user.uid}/integrations/${docId}`).get(),
    db.doc(`users/${user.uid}`).get(),
  ]);

  const account = snap.data() ?? null;
  const userData = userSnap.data();
  const dnaKey = projectTitle ? `threadsContentDNA__${slug(projectTitle)}` : "threadsContentDNA";
  let dna = userData?.[dnaKey] ?? null;

  // One-time migration: if no namespaced DNA but old flat-key DNA exists, migrate it
  if (!dna && projectTitle && userData?.threadsContentDNA && !userData?.threadsDNAMigrated) {
    dna = userData.threadsContentDNA;
    await db.doc(`users/${user.uid}`).set({ [dnaKey]: dna, threadsDNAMigrated: true }, { merge: true });
  }

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
