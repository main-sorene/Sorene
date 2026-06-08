import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

// Meta redirects here after the user approves the Threads OAuth dialog.
// Exchanges the code for a short-lived token, then upgrades to a long-lived token,
// and stores it in Firestore under users/{uid}/integrations/threads.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (error || !code || !state) {
    return Response.redirect(`${appUrl}/execution-hub?threads_error=1`);
  }

  let uid: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    uid = decoded.uid;
    if (!uid) throw new Error("missing uid");
  } catch {
    return Response.redirect(`${appUrl}/execution-hub?threads_error=1`);
  }

  const appId = process.env.THREADS_APP_ID!;
  const appSecret = process.env.THREADS_APP_SECRET!;
  const redirectUri = process.env.THREADS_REDIRECT_URI!;

  try {
    // Step 1 — exchange code for short-lived token
    const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokenData = await tokenRes.json() as { access_token: string; user_id: string | number };
    const shortToken = tokenData.access_token;
    const threadsUserId = String(tokenData.user_id);

    // Step 2 — upgrade to long-lived token (valid 60 days)
    const longRes = await fetch(
      `https://graph.threads.net/access_token?` +
      new URLSearchParams({
        grant_type: "th_exchange_token",
        client_secret: appSecret,
        access_token: shortToken,
      })
    );
    if (!longRes.ok) throw new Error("Long-lived token exchange failed");
    const { access_token: longToken, expires_in } = await longRes.json() as {
      access_token: string;
      expires_in: number;
    };

    // Step 3 — fetch the user's Threads profile (username + profile pic)
    const profileRes = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}?fields=id,username,threads_profile_picture_url&access_token=${longToken}`
    );
    const profile = profileRes.ok
      ? await profileRes.json() as { id: string; username: string; threads_profile_picture_url?: string }
      : { id: threadsUserId, username: "", threads_profile_picture_url: undefined };

    // Step 4 — persist to Firestore
    const db = getAdminFirestore();
    await db.doc(`users/${uid}/integrations/threads`).set({
      accessToken: longToken,
      threadsUserId,
      username: profile.username ?? "",
      profilePictureUrl: profile.threads_profile_picture_url ?? "",
      expiresAt: Date.now() + expires_in * 1000,
      connectedAt: Date.now(),
    });

    return Response.redirect(`${appUrl}/execution-hub?threads_connected=1`);
  } catch (err) {
    console.error("[threads/callback]", err);
    return Response.redirect(`${appUrl}/execution-hub?threads_error=1`);
  }
}
