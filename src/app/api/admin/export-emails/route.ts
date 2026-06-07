import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

// Returns all user emails as a downloadable .txt file.
// Access: ?secret=YOUR_ADMIN_SECRET or Authorization: Bearer YOUR_ADMIN_SECRET
export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return Response.json({ error: "Admin auth not configured" }, { status: 500 });
  }

  const emails: string[] = [];
  let pageToken: string | undefined;

  do {
    const result = await adminAuth.listUsers(1000, pageToken);
    for (const user of result.users) {
      if (user.email) emails.push(user.email);
    }
    pageToken = result.pageToken;
  } while (pageToken);

  return new Response(emails.join("\n"), {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="sorene-emails-${new Date().toISOString().slice(0, 10)}.txt"`,
    },
  });
}
