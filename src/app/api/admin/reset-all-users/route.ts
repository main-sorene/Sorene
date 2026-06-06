import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

// One-shot admin endpoint to wipe every user's Firestore data.
// Firebase Auth accounts are intentionally KEPT so the email list is preserved.
// Protected by ADMIN_SECRET env var — must pass as Bearer token.
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const results = { usersWiped: 0, errors: [] as string[] };

  // Delete all documents in the `users` collection + subcollections
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    try {
      const convoSnap = await db.collection("users").doc(uid).collection("conversations").get();
      await Promise.all(convoSnap.docs.map((d) => d.ref.delete()));
      await userDoc.ref.delete();
      results.usersWiped++;
    } catch (e: any) {
      results.errors.push(`users/${uid}: ${e.message}`);
    }
  }

  // Delete messagingChats + messages subcollection
  const chatSnap = await db.collection("messagingChats").get();
  for (const chatDoc of chatSnap.docs) {
    try {
      const msgsSnap = await chatDoc.ref.collection("messages").get();
      await Promise.all(msgsSnap.docs.map((d) => d.ref.delete()));
      await chatDoc.ref.delete();
    } catch (e: any) {
      results.errors.push(`messagingChats/${chatDoc.id}: ${e.message}`);
    }
  }

  // Delete all messagingLinkTokens
  const tokensSnap = await db.collection("messagingLinkTokens").get();
  await Promise.all(tokensSnap.docs.map((d) => d.ref.delete()));

  return Response.json({ success: true, ...results });
}
