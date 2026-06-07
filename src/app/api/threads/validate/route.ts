import { NextRequest } from "next/server";
import { verifyAuth, getAdminFirestore } from "@/lib/firebaseAdmin";

// Quick check that the stored token can still call the Threads API
export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminFirestore().collection("users").doc(user.uid).get();
  const account = snap.data()?.threadsAccount as { accessToken?: string; userId?: string } | undefined;
  if (!account?.accessToken || !account.userId) {
    return Response.json({ valid: false, reason: "not_connected" });
  }

  try {
    const res = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${account.accessToken}`
    );
    const data = await res.json() as { id?: string; username?: string; error?: { message?: string; code?: number } };

    if (data.error) {
      return Response.json({ valid: false, reason: data.error.message ?? "token_invalid" });
    }
    if (!data.id) {
      return Response.json({ valid: false, reason: "token_invalid" });
    }
    return Response.json({ valid: true, username: data.username ?? "" });
  } catch {
    return Response.json({ valid: false, reason: "network_error" });
  }
}
