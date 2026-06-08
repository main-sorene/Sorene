import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export interface XScheduledPost {
  id: string;
  text: string;
  scheduledAt: number;
  status: "pending" | "published" | "failed";
  createdAt: number;
  tweetId?: string;
  failReason?: string;
  projectTitle?: string;
}

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");

  let query: FirebaseFirestore.Query = getAdminFirestore()
    .collection("users").doc(user.uid)
    .collection("xScheduled");

  if (projectTitle) {
    query = query.where("projectTitle", "==", projectTitle);
  }

  const snap = await query.get();
  const all = snap.docs.map((d) => d.data() as XScheduledPost);
  return Response.json({
    posts: all.filter((p) => p.status === "pending").sort((a, b) => a.scheduledAt - b.scheduledAt),
    published: all.filter((p) => p.status === "published"),
    failed: all.filter((p) => p.status === "failed"),
  });
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const { text, scheduledAt } = await req.json() as { text: string; scheduledAt: number };
  if (!text?.trim() || !scheduledAt) return Response.json({ error: "Missing fields" }, { status: 400 });

  const col = getAdminFirestore().collection("users").doc(user.uid).collection("xScheduled");

  // Deduplicate
  let dedupeQuery: FirebaseFirestore.Query = col.where("status", "==", "pending").where("text", "==", text.trim());
  if (projectTitle) dedupeQuery = dedupeQuery.where("projectTitle", "==", projectTitle);
  const existing = await dedupeQuery.limit(1).get();
  if (!existing.empty) return Response.json({ ok: true, post: existing.docs[0].data() as XScheduledPost });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const post: XScheduledPost = {
    id,
    text: text.trim(),
    scheduledAt,
    status: "pending",
    createdAt: Date.now(),
    ...(projectTitle ? { projectTitle } : {}),
  };
  await col.doc(id).set(post);
  return Response.json({ ok: true, post });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  await getAdminFirestore().collection("users").doc(user.uid).collection("xScheduled").doc(id).delete();
  return Response.json({ ok: true });
}
