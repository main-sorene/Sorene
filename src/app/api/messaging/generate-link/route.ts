import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { createLinkToken } from "@/lib/messagingAdmin";

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { platform?: string };
  const platform = body.platform;
  if (platform !== "telegram" && platform !== "whatsapp") {
    return Response.json({ error: "Invalid platform" }, { status: 400 });
  }

  const token = await createLinkToken(user.uid, platform);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "";
  const waPhone = process.env.WHATSAPP_DISPLAY_PHONE ?? "";

  const deepLink = platform === "telegram"
    ? `https://t.me/${botUsername}?start=${token}`
    : `https://wa.me/${waPhone}?text=${encodeURIComponent(`LINK-${token}`)}`;

  return Response.json({ token, deepLink, expiresAt });
}
