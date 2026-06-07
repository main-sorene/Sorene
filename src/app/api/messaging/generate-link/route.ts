import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { createLinkToken } from "@/lib/messagingAdmin";

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { platform?: string };
  const platform = body.platform;
  if (platform !== "whatsapp") {
    return Response.json({ error: "Invalid platform" }, { status: 400 });
  }

  const token = await createLinkToken(user.uid, platform);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // WHATSAPP_DISPLAY_PHONE must be the actual WhatsApp number in international
  // format without + or spaces, e.g. "15556651234". The Phone Number ID is
  // different — it's used for the Graph API, not wa.me links.
  const waPhone = process.env.WHATSAPP_DISPLAY_PHONE ?? "";
  const deepLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`LINK-${token}`)}`;

  return Response.json({ token, deepLink, expiresAt });
}
