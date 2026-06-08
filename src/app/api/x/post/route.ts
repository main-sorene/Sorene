import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import type { XKeys } from "../keys/route";

export async function postTweet(apiKey: string, apiSecret: string, accessToken: string, accessTokenSecret: string, text: string): Promise<string> {
  const OAuth = (await import("oauth-1.0a")).default;
  const crypto = await import("crypto");

  const oauth = new OAuth({
    consumer: { key: apiKey, secret: apiSecret },
    signature_method: "HMAC-SHA1",
    hash_function(base, key) {
      return crypto.createHmac("sha1", key).update(base).digest("base64");
    },
  });

  const url = "https://api.twitter.com/2/tweets";
  const token = { key: accessToken, secret: accessTokenSecret };
  const headers = oauth.toHeader(oauth.authorize({ url, method: "POST" }, token));

  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json() as { data?: { id: string }; errors?: { message: string }[] };
  if (!data.data?.id) throw new Error(data.errors?.[0]?.message ?? "Post failed");
  return data.data.id;
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return Response.json({ error: "Missing text" }, { status: 400 });

  const snap = await getAdminFirestore().doc(`users/${user.uid}/integrations/x`).get();
  const keys = snap.data() as XKeys | undefined;
  if (!keys?.apiKey) return Response.json({ error: "X not connected" }, { status: 400 });

  try {
    const tweetId = await postTweet(keys.apiKey, keys.apiSecret, keys.accessToken, keys.accessTokenSecret, text.trim());
    return Response.json({ ok: true, tweetId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to post";
    return Response.json({ error: msg }, { status: 500 });
  }
}
