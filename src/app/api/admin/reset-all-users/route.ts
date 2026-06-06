import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/messagingAdmin";
import { getAdminAuth } from "@/lib/firebaseAdmin";

// One-shot admin endpoint to wipe every user's data and delete all Auth accounts.
// Protected by ADMIN_SECRET env var — must pass as Bearer token.
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const adminAuth = getAdminAuth();
  const results = { usersDeleted: 0, errors: [] as string[] };

  // 1. Delete all documents in the `users` collection + subcollections
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    try {
      // Delete conversations subcollection
      const convoSnap = await db.collection("users").doc(uid).collection("conversations").get();
      await Promise.all(convoSnap.docs.map((d) => d.ref.delete()));

      // Delete the user doc itself
      await userDoc.ref.delete();
    } catch (e: any) {
      results.errors.push(`users/${uid}: ${e.message}`);
    }
  }

  // 2. Delete messagingChats + their messages subcollection
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

  // 3. Delete all messagingLinkTokens
  const tokensSnap = await db.collection("messagingLinkTokens").get();
  await Promise.all(tokensSnap.docs.map((d) => d.ref.delete()));

  // 4. Delete all Firebase Auth users in batches
  if (adminAuth) {
    let pageToken: string | undefined;
    do {
      const listResult = await adminAuth.listUsers(1000, pageToken);
      const uids = listResult.users.map((u) => u.uid);
      if (uids.length > 0) {
        const deleteResult = await adminAuth.deleteUsers(uids);
        results.usersDeleted += deleteResult.successCount;
        deleteResult.errors.forEach((e) =>
          results.errors.push(`auth/${uids[e.index]}: ${e.error.message}`)
        );
      }
      pageToken = listResult.pageToken;
    } while (pageToken);
  }

  return Response.json({ success: true, ...results });
}
