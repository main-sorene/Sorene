import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAdminAuth } from "@/lib/firebaseAdmin";

// Wipes all Firestore data AND deletes all Firebase Auth accounts.
// Access: ?secret=YOUR_ADMIN_SECRET
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const adminAuth = getAdminAuth();
  const results = { usersWiped: 0, authDeleted: 0, errors: [] as string[] };

  // Delete all Firestore user docs + subcollections
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

  // Delete messagingChats
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

  // Delete messagingLinkTokens
  const tokensSnap = await db.collection("messagingLinkTokens").get();
  await Promise.all(tokensSnap.docs.map((d: any) => d.ref.delete()));

  // Delete ALL Firebase Auth accounts
  if (adminAuth) {
    let pageToken: string | undefined;
    do {
      const listResult = await adminAuth.listUsers(1000, pageToken);
      const uids = listResult.users.map((u) => u.uid);
      if (uids.length > 0) {
        const deleteResult = await adminAuth.deleteUsers(uids);
        results.authDeleted += deleteResult.successCount;
        deleteResult.errors.forEach((e: any) =>
          results.errors.push(`auth/${uids[e.index]}: ${e.error.message}`)
        );
      }
      pageToken = listResult.pageToken;
    } while (pageToken);
  }

  return Response.json({ success: true, ...results });
}

export async function POST(req: NextRequest) { return GET(req); }
