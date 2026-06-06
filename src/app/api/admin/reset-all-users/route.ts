import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

// Wipes all Firestore user data. Firebase Auth accounts are KEPT.
// Access: ?secret=YOUR_ADMIN_SECRET or Authorization: Bearer YOUR_ADMIN_SECRET
async function handleReset(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const results = { usersWiped: 0, errors: [] as string[] };

  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    try {
      const convoSnap = await db.collection("users").doc(uid).collection("conversations").get();
      await Promise.all(convoSnap.docs.map((d: any) => d.ref.delete()));
      await userDoc.ref.delete();
      results.usersWiped++;
    } catch (e: any) {
      results.errors.push(`users/${uid}: ${e.message}`);
    }
  }

  const chatSnap = await db.collection("messagingChats").get();
  for (const chatDoc of chatSnap.docs) {
    try {
      const msgsSnap = await chatDoc.ref.collection("messages").get();
      await Promise.all(msgsSnap.docs.map((d: any) => d.ref.delete()));
      await chatDoc.ref.delete();
    } catch (e: any) {
      results.errors.push(`messagingChats/${chatDoc.id}: ${e.message}`);
    }
  }

  const tokensSnap = await db.collection("messagingLinkTokens").get();
  await Promise.all(tokensSnap.docs.map((d: any) => d.ref.delete()));

  return Response.json({ success: true, ...results });
}

export async function GET(req: NextRequest) { return handleReset(req); }
export async function POST(req: NextRequest) { return handleReset(req); }
