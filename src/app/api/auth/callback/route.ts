import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const REDIRECT_URI = `${APP_URL}/api/auth/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${APP_URL}/?auth_error=${encodeURIComponent(error)}`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${APP_URL}/?auth_error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/?auth_error=no_code`);
  }

  // Exchange code for tokens — id_token is a Google ID token usable directly
  // with Firebase signInWithCredential (no Admin SDK required).
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[callback] token exchange failed:", err);
    return NextResponse.redirect(`${APP_URL}/?auth_error=token_exchange_failed`);
  }

  const { id_token } = await tokenRes.json();

  if (!id_token) {
    return NextResponse.redirect(`${APP_URL}/?auth_error=no_id_token`);
  }

  // Pass the Google ID token to the client — it calls signInWithCredential
  // directly, bypassing Firebase Admin SDK custom tokens entirely.
  return NextResponse.redirect(
    `${APP_URL}/?google_id_token=${encodeURIComponent(id_token)}`,
  );
}
