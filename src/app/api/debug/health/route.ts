import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

// Diagnostic endpoint — checks every critical service.
// Access: /api/debug/health?secret=<ADMIN_SECRET>
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // Env vars (show presence only, never values)
  results.FIREBASE_SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? "SET" : "MISSING";
  results.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING";
  results.NEXT_PUBLIC_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "SET" : "MISSING";
  results.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ? "SET" : "MISSING";
  results.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "MISSING";
  results.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? "SET" : "MISSING";

  // Admin Auth
  try {
    const adminAuth = getAdminAuth();
    // Try creating a test token — proves credentials work
    await adminAuth!.createCustomToken("health-check-test@sorene.ai");
    results.adminAuth = "OK — custom token creation works";
  } catch (e: any) {
    results.adminAuth = `FAILED: ${e.message}`;
  }

  // Admin Firestore
  try {
    const db = getAdminFirestore();
    // Try a lightweight read
    const snap = await db.collection("users").limit(1).get();
    results.adminFirestore = `OK — connected (${snap.size} doc sampled)`;
  } catch (e: any) {
    results.adminFirestore = `FAILED: ${e.message}`;
  }

  return NextResponse.json(results, { status: 200 });
}
