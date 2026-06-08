import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/firebaseAdmin";

const THREADS_APP_ID = process.env.THREADS_APP_ID ?? "";
const THREADS_REDIRECT_URI = process.env.THREADS_REDIRECT_URI ?? "";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!THREADS_APP_ID || !THREADS_REDIRECT_URI) {
    return Response.json({ error: "Threads not configured" }, { status: 500 });
  }

  const project = req.nextUrl.searchParams.get("project") ?? "";
  const state = Buffer.from(JSON.stringify({ uid: user.uid, project, ts: Date.now() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: THREADS_APP_ID,
    redirect_uri: THREADS_REDIRECT_URI,
    scope: "threads_basic,threads_content_publish,threads_manage_insights",
    response_type: "code",
    state,
  });

  return Response.json({ url: `https://threads.net/oauth/authorize?${params}` });
}
