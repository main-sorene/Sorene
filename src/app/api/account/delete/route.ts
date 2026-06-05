import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = user.uid;
  const db = getAdminFirestore();

  try {
    // Delete messagingChats subcollection
    const messagesRef = db.collection("messagingChats").doc(uid).collection("messages");
    const messages = await messagesRef.get();
    const msgDeletes = messages.docs.map((d: { ref: { delete: () => Promise<unknown> } }) => d.ref.delete());
    await Promise.all(msgDeletes);
    await db.collection("messagingChats").doc(uid).delete();

    // Delete messagingLinkTokens for this user
    const tokensSnap = await db.collection("messagingLinkTokens").where("uid", "==", uid).get();
    const tokenDeletes = tokensSnap.docs.map((d: { ref: { delete: () => Promise<unknown> } }) => d.ref.delete());
    await Promise.all(tokenDeletes);

    // Delete Firebase Auth user (server-side, more reliable than client deleteUser)
    if (getApps().length) {
      await getAuth().deleteUser(uid).catch(() => {});
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[account/delete] error:", err);
    return Response.json({ error: "Failed to delete account data" }, { status: 500 });
  }
}
