import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

function safe(title: string) {
  return title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

// Archive / unarchive / delete an execution project.
// Delete also cleans up all related per-project data from Firestore.
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { action, projectTitle } = (await req.json()) as {
    action: "archive" | "unarchive" | "delete";
    projectTitle: string;
  };
  if (!action || !projectTitle) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const userRef = db.collection("users").doc(user.uid);
  const snap = await userRef.get();
  const projects: { title: string; archived?: boolean }[] = snap.data()?.executionProjects ?? [];

  if (action === "delete") {
    const remaining = projects.filter((p) => p.title !== projectTitle);
    await userRef.set({ executionProjects: remaining }, { merge: true });

    // Clean up related per-project documents.
    await Promise.all([
      userRef.collection("patternSummaries").doc(safe(projectTitle)).delete().catch(() => {}),
      userRef.collection("executionConversations").doc(safe(projectTitle)).delete().catch(() => {}),
    ]);

    // Strip this project's keys out of the synced execution-state blob.
    try {
      const stateRef = userRef.collection("executionState").doc("hub");
      const stateSnap = await stateRef.get();
      const entries: Record<string, string> = stateSnap.data()?.entries ?? {};
      const suffix = `-${projectTitle}`;
      let changed = false;
      for (const key of Object.keys(entries)) {
        if (key.endsWith(suffix) || key === `custom-project-names`) {
          if (key === "custom-project-names") {
            try {
              const map = JSON.parse(entries[key]);
              if (map && typeof map === "object" && projectTitle in map) {
                delete map[projectTitle];
                entries[key] = JSON.stringify(map);
                changed = true;
              }
            } catch { /* ignore */ }
          } else {
            delete entries[key];
            changed = true;
          }
        }
      }
      if (changed) await stateRef.set({ entries, updatedAt: Date.now() }, { merge: false });
    } catch { /* ignore */ }

    return Response.json({ success: true, projects: remaining });
  }

  // archive / unarchive
  const updated = projects.map((p) =>
    p.title === projectTitle ? { ...p, archived: action === "archive" } : p
  );
  await userRef.set({ executionProjects: updated }, { merge: true });
  return Response.json({ success: true, projects: updated });
}
