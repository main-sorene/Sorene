import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export interface ScheduledPost {
  id: string;
  text: string;
  scheduledAt: number;
  status: "pending" | "published" | "failed";
  createdAt: number;
}

// GET — list scheduled posts
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminFirestore()
    .collection("users").doc(user.uid)
    .collection("threadsScheduled")
    .where("status", "==", "pending")
    .orderBy("scheduledAt", "asc")
    .get();

  const posts: ScheduledPost[] = snap.docs.map((d) => d.data() as ScheduledPost);
  return Response.json({ posts });
}

// POST — create scheduled post
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { text, scheduledAt } = await req.json() as { text: string; scheduledAt: number };
  if (!text?.trim() || !scheduledAt) return Response.json({ error: "Missing fields" }, { status: 400 });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const post: ScheduledPost = { id, text: text.trim(), scheduledAt, status: "pending", createdAt: Date.now() };

  await getAdminFirestore()
    .collection("users").doc(user.uid)
    .collection("threadsScheduled").doc(id)
    .set(post);

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
