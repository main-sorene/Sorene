import { NextResponse } from "next/server";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_KEY}` },
  });
  if (!res.ok) throw new Error(`Stripe ${path} failed: ${res.status}`);
  return res.json();
}

export async function GET() {
  if (!STRIPE_KEY) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 503 });
  }

  try {
    // Current MRR: sum of active subscription amounts
    const subsData = await stripeGet(
      "/subscriptions?status=active&limit=100&expand[]=data.items.data.price"
    );

    let mrr = 0;
    for (const sub of subsData.data as any[]) {
      for (const item of sub.items.data as any[]) {
        const price = item.price;
        const amount = item.quantity * price.unit_amount;
        // Normalise to monthly
        if (price.recurring?.interval === "month") mrr += amount;
        else if (price.recurring?.interval === "year") mrr += Math.round(amount / 12);
      }
    }

    // Revenue last 6 months
    const now = new Date();
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const charges = await stripeGet(
        `/charges?created[gte]=${Math.floor(start.getTime() / 1000)}&created[lt]=${Math.floor(end.getTime() / 1000)}&limit=100`
      );
      const total = (charges.data as any[]).reduce(
        (sum: number, c: any) => (c.paid && !c.refunded ? sum + c.amount : sum),
        0
      );
      monthlyRevenue.push({
        month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
        revenue: total / 100,
      });
    }

    // Active subscriber count
    const activeCount = subsData.data.length;

    return NextResponse.json({ mrr: mrr / 100, activeSubscribers: activeCount, monthlyRevenue });
  } catch (err) {
    console.error("[admin/revenue]", err);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}
