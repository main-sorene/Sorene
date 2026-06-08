import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import { verifyAuth } from "@/lib/firebaseAdmin";

// Check domain availability via DNS lookup.
// NXDOMAIN (ENOTFOUND) → likely available. Any resolved address → taken.
async function isDomainAvailable(domain: string): Promise<boolean> {
  try {
    await dns.lookup(domain);
    return false; // resolved → taken
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "ENOTFOUND") return true; // no DNS record → available
    }
    return false; // unknown error → treat as unavailable to be safe
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { domains } = (await req.json()) as { domains: string[] };
    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json({ error: "Missing domains" }, { status: 400 });
    }

    const results = await Promise.all(
      domains.slice(0, 20).map(async (domain) => ({
        domain,
        available: await isDomainAvailable(domain.toLowerCase().trim()),
      }))
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[check-domain] error:", error);
    return NextResponse.json({ error: "Failed to check domains." }, { status: 500 });
  }
}
