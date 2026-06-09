import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = process.env.REDDIT_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/reddit/callback`;
  if (!clientId) return Response.json({ error: "Reddit OAuth not configured" }, { status: 500 });

  const project = req.nextUrl.searchParams.get("project") ?? "";
  const state = Buffer.from(JSON.stringify({ uid: user.uid, project })).toString("base64url");
  const scope = "identity read submit";
  const url = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${encodeURIComponent(scope)}`;

  return Response.json({ url });
}
