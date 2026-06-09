import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

function summaryDoc(uid: string, projectTitle: string) {
  const safeTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return getAdminFirestore()
    .collection("users").doc(uid)
    .collection("patternSummaries").doc(safeTitle);
}

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project") ?? "";
  const snap = await summaryDoc(user.uid, projectTitle).get();
  return Response.json(snap.data() ?? null);
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectTitle, history } = await req.json();
  if (!projectTitle || !Array.isArray(history)) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  await summaryDoc(user.uid, projectTitle).set({ history, savedAt: Date.now() });
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectTitle } = await req.json();
  if (!projectTitle) return Response.json({ error: "Missing fields" }, { status: 400 });

  await summaryDoc(user.uid, projectTitle).delete();
  return Response.json({ success: true });
}
