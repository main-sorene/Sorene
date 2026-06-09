import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

function projectDoc(uid: string, projectTitle: string) {
  const safeTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return getAdminFirestore()
    .collection("users").doc(uid)
    .collection("executionConversations").doc(safeTitle);
}

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project") ?? "";
  const snap = await projectDoc(user.uid, projectTitle).get();
  const entries = snap.data()?.entries ?? [];
  return Response.json({ entries });
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectTitle, entry } = await req.json();
  if (!projectTitle || !entry?.id) return Response.json({ error: "Missing fields" }, { status: 400 });

  await projectDoc(user.uid, projectTitle).set(
    { entries: FieldValue.arrayUnion(entry) },
    { merge: true }
  );
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectTitle, entryId } = await req.json();
  if (!projectTitle || !entryId) return Response.json({ error: "Missing fields" }, { status: 400 });

  const ref = projectDoc(user.uid, projectTitle);
  const snap = await ref.get();
  const entries: { id: string }[] = snap.data()?.entries ?? [];
  await ref.set({ entries: entries.filter((e) => e.id !== entryId) }, { merge: true });
  return Response.json({ success: true });
}
