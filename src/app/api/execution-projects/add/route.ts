import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { project } = await req.json();
  if (!project?.title) return Response.json({ error: "Missing project" }, { status: 400 });

  const db = getAdminFirestore();
  await db.collection("users").doc(user.uid).set(
    { executionProjects: FieldValue.arrayUnion(project) },
    { merge: true }
  );

  return Response.json({ success: true });
}
