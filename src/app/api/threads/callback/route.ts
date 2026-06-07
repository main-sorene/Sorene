import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

const THREADS_APP_ID = process.env.THREADS_APP_ID ?? "";
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET ?? "";
const THREADS_REDIRECT_URI = process.env.THREADS_REDIRECT_URI ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = APP_URL || `https://${req.headers.get("host") ?? "sorene.ai"}`;
  const failUrl = `${base}/execution-hub?tab=agents&threads_error=1`;
  const successUrl = `${base}/execution-hub?tab=agents&threads_connected=1`;

  if (error || !code || !state) {
    return NextResponse.redirect(failUrl);
  }

  let uid: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    uid = decoded.uid;
    if (!uid) throw new Error("no uid");
  } catch {
    return NextResponse.redirect(failUrl);
  }

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: THREADS_APP_ID,
        client_secret: THREADS_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: THREADS_REDIRECT_URI,
        code,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; user_id?: string | number };
    if (!tokenData.access_token) throw new Error("no token");

    const shortToken = tokenData.access_token;
    const userId = String(tokenData.user_id ?? "");

    // Exchange for long-lived token (valid 60 days)
    const longRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${THREADS_APP_SECRET}&access_token=${shortToken}`
    );
    const longData = await longRes.json() as { access_token?: string };
    const accessToken = longData.access_token ?? shortToken;

    // Get username
    const meRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}?fields=username&access_token=${accessToken}`
    );
    const meData = await meRes.json() as { username?: string };
    const username = meData.username ?? "";

    await getAdminFirestore().collection("users").doc(uid).set({
      threadsAccount: { accessToken, userId, username, connectedAt: Date.now() },
    }, { merge: true });

    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("[threads callback]", err);
    return NextResponse.redirect(failUrl);
  }
}
