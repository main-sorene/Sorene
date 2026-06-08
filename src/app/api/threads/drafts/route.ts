import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export interface DraftPost {
  id: string;
  text: string;
  editing: boolean;
  schedulerOpen: boolean;
}

export interface DraftBatch {
  drafts: DraftPost[];
  ctaLink: string;
  cadence: 1 | 2 | 3;
  slotOverrides: Record<string, number>;
  userNotes: string;
  savedAt: number;
}

// GET — load saved draft batch
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminFirestore().collection("users").doc(user.uid).get();
  const batch = snap.data()?.threadsDraftBatch as DraftBatch | undefined;
  return Response.json({ batch: batch ?? null });
}

// PUT — save draft batch
export async function PUT(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<DraftBatch>;
  const batch: DraftBatch = {
    drafts: body.drafts ?? [],
    ctaLink: body.ctaLink ?? "",
    cadence: body.cadence ?? 1,
    slotOverrides: body.slotOverrides ?? {},
    userNotes: (body as DraftBatch & { userNotes?: string }).userNotes ?? "",
    savedAt: Date.now(),
  };

  await getAdminFirestore().collection("users").doc(user.uid).set(
    { threadsDraftBatch: batch },
    { merge: true }
  );

  return Response.json({ ok: true });
}

// DELETE — clear draft batch (after approve all or manual clear)
export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { FieldValue } = await import("firebase-admin/firestore");
  await getAdminFirestore().collection("users").doc(user.uid).update({
    threadsDraftBatch: FieldValue.delete(),
  });

  return Response.json({ ok: true });
}
