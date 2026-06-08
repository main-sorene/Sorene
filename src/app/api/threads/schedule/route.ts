import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export interface ScheduledPost {
  id: string;
  text: string;
  ctaLink?: string;
  scheduledAt: number;
  status: "pending" | "published" | "failed";
  createdAt: number;
  projectTitle?: string;
}

// GET — list scheduled posts
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const db = getAdminFirestore();
  const col = db.collection("users").doc(user.uid).collection("threadsScheduled");

  const userSnap = await db.doc(`users/${user.uid}`).get();
  const isLegacyOwner = projectTitle && userSnap.data()?.legacyProjectTitle === projectTitle;

  let snap: FirebaseFirestore.QuerySnapshot;
  if (projectTitle) {
    const tagged = await col.where("projectTitle", "==", projectTitle).get();
    if (isLegacyOwner) {
      // Also include old posts that were created before project namespacing
      const allDocs = await col.get();
      const untagged = allDocs.docs.filter((d) => !d.data().projectTitle);
      const combined = new Map<string, FirebaseFirestore.DocumentData>();
      [...tagged.docs, ...untagged].forEach((d) => combined.set(d.id, d.data()));
      snap = { docs: [...tagged.docs, ...untagged].filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i) } as unknown as FirebaseFirestore.QuerySnapshot;
    } else {
      snap = tagged;
    }
  } else {
    snap = await col.get();
  }

  const all = snap.docs.map((d) => d.data() as ScheduledPost);
  const posts = all
    .filter((p) => p.status === "pending")
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
  const failed = all.filter((p) => p.status === "failed");
  const published = all.filter((p) => p.status === "published");
  return Response.json({ posts, failed, published });
}

// POST — create scheduled post (deduplicates by text — skips if already pending)
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const { text, scheduledAt, ctaLink } = await req.json() as { text: string; scheduledAt: number; ctaLink?: string };
  if (!text?.trim() || !scheduledAt) return Response.json({ error: "Missing fields" }, { status: 400 });

  const db = getAdminFirestore();
  const col = db.collection("users").doc(user.uid).collection("threadsScheduled");

  // Deduplicate: if an identical pending post already exists, return it instead of creating a duplicate
  let dedupeQuery: FirebaseFirestore.Query = col.where("status", "==", "pending").where("text", "==", text.trim());
  if (projectTitle) dedupeQuery = dedupeQuery.where("projectTitle", "==", projectTitle);
  const existing = await dedupeQuery.limit(1).get();
  if (!existing.empty) {
    return Response.json({ ok: true, post: existing.docs[0].data() as ScheduledPost });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const post: ScheduledPost = {
    id,
    text: text.trim(),
    scheduledAt,
    status: "pending",
    createdAt: Date.now(),
    ...(ctaLink?.trim() ? { ctaLink: ctaLink.trim() } : {}),
    ...(projectTitle ? { projectTitle } : {}),
  };

  await col.doc(id).set(post);

  return Response.json({ ok: true, post });
}

// DELETE — cancel a scheduled post
export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await getAdminFirestore()
    .collection("users").doc(user.uid)
    .collection("threadsScheduled").doc(id)
    .update({ status: FieldValue.delete() });

  await getAdminFirestore()
    .collection("users").doc(user.uid)
    .collection("threadsScheduled").doc(id)
    .delete();

  return Response.json({ ok: true });
}
