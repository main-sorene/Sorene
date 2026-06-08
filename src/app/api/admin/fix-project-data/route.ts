import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

const slug = (t: string) => t.replace(/[.[\]#$/]/g, "_").slice(0, 80);

// POST — assign legacy flat-key data to a specific project for a user
// Body: { email: string, legacyProjectTitle: string }
// This sets legacyProjectTitle on the user doc and migrates the Threads integration doc
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { email, legacyProjectTitle } = await req.json() as { email: string; legacyProjectTitle: string };
  if (!email || !legacyProjectTitle) return Response.json({ error: "email and legacyProjectTitle required" }, { status: 400 });

  const db = getAdminFirestore();

  // Find user by email (doc ID may be email for some users)
  let uid: string | null = null;
  const directSnap = await db.collection("users").doc(email).get();
  if (directSnap.exists) {
    uid = email;
  } else {
    const querySnap = await db.collection("users").where("email", "==", email).limit(1).get();
    if (!querySnap.empty) uid = querySnap.docs[0].id;
  }
  if (!uid) {
    // Try Firebase Auth
    try {
      const { getAuth } = await import("firebase-admin/auth");
      const authUser = await getAuth().getUserByEmail(email);
      uid = authUser.uid;
    } catch { /* ignore */ }
  }
  if (!uid) return Response.json({ error: "User not found" }, { status: 404 });

  const projectSlug = slug(legacyProjectTitle);
  const actions: string[] = [];

  // 1. Set legacyProjectTitle on user doc
  await db.collection("users").doc(uid).set({ legacyProjectTitle }, { merge: true });
  actions.push(`Set legacyProjectTitle: "${legacyProjectTitle}"`);

  // 2. Migrate integrations/threads → integrations/threads__${slug} if not already done
  const legacyInteg = await db.doc(`users/${uid}/integrations/threads`).get();
  const namedInteg = await db.doc(`users/${uid}/integrations/threads__${projectSlug}`).get();
  if (legacyInteg.exists && !namedInteg.exists) {
    await db.doc(`users/${uid}/integrations/threads__${projectSlug}`).set(legacyInteg.data()!);
    actions.push(`Migrated integrations/threads → threads__${projectSlug}`);
  }

  // 3. Clear any wrongly-namespaced data for OTHER projects (wipe keys that don't belong to legacyProjectTitle)
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data() ?? {};
  const keysToDelete: Record<string, unknown> = {};
  const { FieldValue } = await import("firebase-admin/firestore");

  for (const key of Object.keys(userData)) {
    if (
      (key.startsWith("threadsDraftBatch__") || key.startsWith("threadsContentDNA__") || key.startsWith("threadsCompetitors__")) &&
      !key.endsWith(`__${projectSlug}`)
    ) {
      keysToDelete[key] = FieldValue.delete();
      actions.push(`Deleted wrongly-attributed key: ${key}`);
    }
  }
  if (Object.keys(keysToDelete).length > 0) {
    await db.collection("users").doc(uid).update(keysToDelete);
  }

  // 4. Re-stamp scheduled posts that have wrong projectTitle back to untagged (let legacy fallback handle them)
  const colRef = db.collection("users").doc(uid).collection("threadsScheduled");
  const allPosts = await colRef.get();
  const wronglyTagged = allPosts.docs.filter((d) => d.data().projectTitle && d.data().projectTitle !== legacyProjectTitle);
  if (wronglyTagged.length > 0) {
    const batch = db.batch();
    wronglyTagged.forEach((d) => batch.update(d.ref, { projectTitle: FieldValue.delete() }));
    await batch.commit();
    actions.push(`Cleared projectTitle from ${wronglyTagged.length} wrongly-tagged scheduled posts`);
  }

  return Response.json({ ok: true, uid, actions });
}
