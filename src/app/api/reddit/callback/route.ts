import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

const slug = (t: string) => t.replace(/[.[\]#$/]/g, "_").slice(0, 80);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/execution-hub?tab=agents&reddit_error=1`);
  }

  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString()) as { uid: string; project?: string };
    const uid = decoded.uid;
    const project = decoded.project ?? "";
    const clientId = process.env.REDDIT_CLIENT_ID!;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET!;
    const redirectUri = process.env.REDDIT_REDIRECT_URI ?? `${appUrl}/api/reddit/callback`;

    const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Sorene/1.0",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; refresh_token?: string; error?: string };
    if (!tokenData.access_token) throw new Error(tokenData.error ?? "Token exchange failed");

    // Get Reddit username
    const meRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: { "Authorization": `Bearer ${tokenData.access_token}`, "User-Agent": "Sorene/1.0" },
    });
    const me = await meRes.json() as { name?: string; total_karma?: number };

    const docId = project ? `reddit__${slug(project)}` : "reddit";
    await getAdminFirestore().doc(`users/${uid}/integrations/${docId}`).set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      username: me.name ?? "",
      karma: me.total_karma ?? 0,
      connectedAt: Date.now(),
    });

    const redirectParams = new URLSearchParams({ tab: "agents", reddit_connected: "1" });
    if (project) redirectParams.set("project", project);
    return NextResponse.redirect(`${appUrl}/execution-hub?${redirectParams}`);
  } catch (err) {
    console.error("[reddit/callback]", err);
    return NextResponse.redirect(`${appUrl}/execution-hub?tab=agents&reddit_error=1`);
  }
}
