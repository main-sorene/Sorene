import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

// GET /api/social/threads/connect?token=<firebase-id-token>
// Verifies the Firebase token, then redirects to Meta's Threads OAuth page.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idToken = searchParams.get("token");
  if (!idToken) return Response.json({ error: "Missing token" }, { status: 401 });

  const adminAuth = getAdminAuth();
  if (!adminAuth) return Response.json({ error: "Auth not configured" }, { status: 500 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const appId = process.env.THREADS_APP_ID;
  const redirectUri = process.env.THREADS_REDIRECT_URI;
  if (!appId || !redirectUri) {
    return Response.json({ error: "Threads OAuth not configured" }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ uid })).toString("base64url");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state,
  });

  return Response.redirect(
    `https://threads.net/oauth/authorize?${params.toString()}`
  );
}
