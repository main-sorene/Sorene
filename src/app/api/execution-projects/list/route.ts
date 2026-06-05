import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();
  const snap = await db.collection("users").doc(user.uid).get();
  const projects = snap.data()?.executionProjects ?? [];

  return Response.json({ projects });
}
