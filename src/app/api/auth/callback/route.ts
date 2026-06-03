import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { saveUserProfile } from "@/lib/firestore";

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

  // Exchange code for tokens
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
    console.error("Token exchange failed:", err);
    return NextResponse.redirect(`${APP_URL}/?auth_error=token_exchange_failed`);
  }

  const { access_token } = await tokenRes.json();

  // Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(`${APP_URL}/?auth_error=userinfo_failed`);
  }

  const googleUser = await userRes.json();
  const uid = googleUser.email;

  // Save profile to Firestore
  try {
    await saveUserProfile(uid, {
      email: googleUser.email,
      photoUrl: googleUser.picture || undefined,
    });
  } catch (e) {
    console.error("saveUserProfile failed:", e);
  }

  // Create Firebase custom token
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.redirect(`${APP_URL}/?auth_error=admin_not_configured`);
  }

  const customToken = await adminAuth.createCustomToken(uid, {
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
  });

  // Redirect back to app with the custom token in the URL fragment
  return NextResponse.redirect(
    `${APP_URL}/?custom_token=${encodeURIComponent(customToken)}`,
  );
}
