import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

export interface XKeys {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  connectedAt: number;
  username?: string;
}

const slug = (t: string) => t.replace(/[.[\]#$/]/g, "_").slice(0, 80);

// GET — check if X keys are saved
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const docId = projectTitle ? `x__${slug(projectTitle)}` : "x";
  const db = getAdminFirestore();
  const snap = await db.doc(`users/${user.uid}/integrations/${docId}`).get();
  const keys = snap.data() as XKeys | undefined;
  if (!keys?.apiKey) return Response.json({ connected: false });
  return Response.json({ connected: true, username: keys.username, connectedAt: keys.connectedAt });
}

// POST — save X API keys and verify them
export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const { apiKey, apiSecret, accessToken, accessTokenSecret } = await req.json() as Partial<XKeys>;
  if (!apiKey?.trim() || !apiSecret?.trim() || !accessToken?.trim() || !accessTokenSecret?.trim()) {
    return Response.json({ error: "All four keys are required" }, { status: 400 });
  }

  // Verify keys by calling X API to get the authenticated user
  try {
    const OAuth = (await import("oauth-1.0a")).default;
    const crypto = await import("crypto");

    const oauth = new OAuth({
      consumer: { key: apiKey.trim(), secret: apiSecret.trim() },
      signature_method: "HMAC-SHA1",
      hash_function(base, key) {
        return crypto.createHmac("sha1", key).update(base).digest("base64");
      },
    });

    const url = "https://api.twitter.com/2/users/me";
    const token = { key: accessToken.trim(), secret: accessTokenSecret.trim() };
    const headers = oauth.toHeader(oauth.authorize({ url, method: "GET" }, token));

    const res = await fetch(url, { headers: { ...headers, "Content-Type": "application/json" } });
    const data = await res.json() as { data?: { id: string; username: string }; errors?: { message: string }[] };

    if (!data.data?.username) {
      const msg = data.errors?.[0]?.message ?? "Invalid API keys — could not verify";
      return Response.json({ error: msg }, { status: 400 });
    }

    const keys: XKeys = {
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      accessToken: accessToken.trim(),
      accessTokenSecret: accessTokenSecret.trim(),
      connectedAt: Date.now(),
      username: data.data.username,
    };

    const docId = projectTitle ? `x__${slug(projectTitle)}` : "x";
    await getAdminFirestore().doc(`users/${user.uid}/integrations/${docId}`).set(keys);
    return Response.json({ ok: true, username: data.data.username });
  } catch (err) {
    console.error("[x/keys POST]", err);
    return Response.json({ error: "Verification failed — check your keys and try again" }, { status: 400 });
  }
}

// DELETE — disconnect X
export async function DELETE(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projectTitle = req.nextUrl.searchParams.get("project");
  const docId = projectTitle ? `x__${slug(projectTitle)}` : "x";
  await getAdminFirestore().doc(`users/${user.uid}/integrations/${docId}`).delete();
  return Response.json({ ok: true });
}
