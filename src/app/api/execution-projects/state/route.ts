import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

// Per-user blob of Execution Hub progress (mirrors the localStorage keys the
// hub writes). Lets a user's launchpad/brand/validation state survive logout,
// device changes, and cleared browser storage.
function stateDoc(uid: string) {
  return getAdminFirestore()
    .collection("users").doc(uid)
    .collection("executionState").doc("hub");
}

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await stateDoc(user.uid).get();
  const data = snap.data() ?? {};
  return Response.json({ entries: data.entries ?? {}, updatedAt: data.updatedAt ?? 0 });
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { entries } = (await req.json()) as { entries: Record<string, string> };
  if (!entries || typeof entries !== "object") {
    return Response.json({ error: "Missing entries" }, { status: 400 });
  }

  // Firestore single-document limit is ~1MB; guard against runaway blobs.
  const serialized = JSON.stringify(entries);
  if (serialized.length > 900_000) {
    return Response.json({ error: "State too large" }, { status: 413 });
  }

  await stateDoc(user.uid).set({ entries, updatedAt: Date.now() }, { merge: false });
  return Response.json({ success: true });
}
