import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { createLinkToken } from "@/lib/messagingAdmin";

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const platform = body?.platform as "telegram" | "whatsapp" | undefined;
  if (platform !== "telegram" && platform !== "whatsapp") {
    return Response.json({ error: "Invalid platform" }, { status: 400 });
  }

  const token = await createLinkToken(user.uid, platform);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  let deepLink: string;
  if (platform === "telegram") {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "SoreneBot";
    deepLink = `https://t.me/${botUsername}?start=${token}`;
  } else {
    const phone = process.env.WHATSAPP_DISPLAY_PHONE ?? "";
    deepLink = `https://wa.me/${phone}?text=LINK-${token}`;
  }

  return Response.json({ token, deepLink, expiresAt });
}
