import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

interface ThreadsIntegration {
  accessToken: string;
  threadsUserId: string;
  expiresAt: number;
}

// POST { text: string, imageUrl?: string }
// Creates a Threads post on behalf of the authenticated user.
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminFirestore();
  const snap = await db.doc(`users/${user.uid}/integrations/threads`).get();
  if (!snap.exists) {
    return Response.json({ error: "Threads not connected" }, { status: 400 });
  }

  const { accessToken, threadsUserId, expiresAt } = snap.data() as ThreadsIntegration;

  if (Date.now() > expiresAt) {
    return Response.json({ error: "Threads token expired — please reconnect" }, { status: 401 });
  }

  const body = await req.json() as { text?: string; imageUrl?: string };
  const { text, imageUrl } = body;
  if (!text?.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    // Step 1 — create a media container
    const containerParams: Record<string, string> = {
      media_type: imageUrl ? "IMAGE" : "TEXT",
      text,
      access_token: accessToken,
    };
    if (imageUrl) containerParams.image_url = imageUrl;

    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(containerParams),
      }
    );
    if (!containerRes.ok) {
      const err = await containerRes.json();
      throw new Error(JSON.stringify(err));
    }
    const { id: creationId } = await containerRes.json() as { id: string };

    // Step 2 — publish the container
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }),
      }
    );
    if (!publishRes.ok) {
      const err = await publishRes.json();
      throw new Error(JSON.stringify(err));
    }
    const { id: postId } = await publishRes.json() as { id: string };

    return Response.json({ success: true, postId });
  } catch (err) {
    console.error("[threads/publish]", err);
    return Response.json({ error: "Failed to publish" }, { status: 500 });
  }
}
