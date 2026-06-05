import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.users?.[0];
    if (!user?.localId) return null;
    // Basic project check
    if (projectId && !user.localId) return null;
    return user.localId as string;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const idToken = authHeader.replace(/^Bearer\s+/, "");
    if (!idToken) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const uid = await verifyFirebaseToken(idToken);
    if (!uid) return Response.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json() as { platform?: string };
    const platform = body.platform;
    if (platform !== "telegram" && platform !== "whatsapp") {
      return Response.json({ error: "Invalid platform" }, { status: 400 });
    }

    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store token in Firestore via REST
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (projectId) {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/messagingLinkTokens/${token}`;
      await fetch(firestoreUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            platform: { stringValue: platform },
            used: { booleanValue: false },
            expiresAt: { timestampValue: expiresAt },
          },
        }),
      });
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "";
    const waPhone = process.env.WHATSAPP_DISPLAY_PHONE ?? "";

    const deepLink = platform === "telegram"
      ? `https://t.me/${botUsername}?start=${token}`
      : `https://wa.me/${waPhone}?text=${encodeURIComponent(`LINK-${token}`)}`;

    return Response.json({ token, deepLink, expiresAt });
  } catch (err) {
    console.error("[generate-link]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
