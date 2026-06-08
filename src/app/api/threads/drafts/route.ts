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

const slug = (t: string) => t.replace(/[.\[\]#$\/]/g, "_").slice(0, 80);

// GET — load saved draft batch
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const batchKey = projectTitle ? `threadsDraftBatch__${slug(projectTitle)}` : "threadsDraftBatch";

  const snap = await getAdminFirestore().collection("users").doc(user.uid).get();
  const userData = snap.data();
  const batch = (userData?.[batchKey] ?? (projectTitle ? userData?.threadsDraftBatch : undefined)) as DraftBatch | undefined;
  console.log("[drafts GET] uid:", user.uid, "email:", user.email, "key:", batchKey, "drafts:", batch?.drafts?.length ?? 0);
  return Response.json({ batch: batch ?? null });
}

// PUT — save draft batch
export async function PUT(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const batchKey = projectTitle ? `threadsDraftBatch__${slug(projectTitle)}` : "threadsDraftBatch";

  const body = await req.json() as Partial<DraftBatch>;
  const batch: DraftBatch = {
    drafts: body.drafts ?? [],
    ctaLink: body.ctaLink ?? "",
    cadence: body.cadence ?? 1,
    slotOverrides: body.slotOverrides ?? {},
    userNotes: (body as DraftBatch & { userNotes?: string }).userNotes ?? "",
    savedAt: Date.now(),
  };

  console.log("[drafts PUT]", user.uid, "key:", batchKey, "drafts:", batch.drafts.length, "frozen:", batch.drafts.filter((d: DraftPost & { frozen?: boolean }) => d.frozen).length);
  await getAdminFirestore().collection("users").doc(user.uid).set(
    { [batchKey]: batch },
    { merge: true }
  );

  return Response.json({ ok: true });
}

// DELETE — clear draft batch (after approve all or manual clear)
export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const batchKey = projectTitle ? `threadsDraftBatch__${slug(projectTitle)}` : "threadsDraftBatch";

  const { FieldValue } = await import("firebase-admin/firestore");
  await getAdminFirestore().collection("users").doc(user.uid).update({
    [batchKey]: FieldValue.delete(),
  });

  return Response.json({ ok: true });
}
