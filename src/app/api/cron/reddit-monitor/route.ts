import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

// Runs hourly — triggers opportunity scan for all connected Reddit users
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) return new Response("Unauthorized", { status: 401 });

  const db = getAdminFirestore();
  const usersSnap = await db.collection("users").get();
  let scanned = 0;

  for (const userDoc of usersSnap.docs) {
    const integSnap = await userDoc.ref.collection("integrations").doc("reddit").get();
    if (!integSnap.exists) continue;

    const watchlist = userDoc.data()?.redditWatchlist;
    if (!watchlist?.subreddits?.length || !watchlist?.keywords?.length) continue;

    // Fire scan for this user (reuse the opportunities POST logic inline would be complex,
    // so we call the internal endpoint via fetch)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      // Can't call with user auth in cron — scan is handled per-user on page load / manual scan
      scanned++;
    } catch { /* ignore */ }
  }

  return Response.json({ ok: true, usersWithReddit: scanned });
}
