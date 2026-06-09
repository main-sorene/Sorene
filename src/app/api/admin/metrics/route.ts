import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export async function GET() {
  try {
    const db = getAdminDb();
    const usersRef = db.collection("users");

    const [
      totalSnap,
      onboardedSnap,
      dnaSnap,
      directionSnap,
    ] = await Promise.all([
      usersRef.count().get(),
      usersRef.where("onboardingComplete", "==", true).count().get(),
      usersRef.where("dnaAssessmentComplete", "==", true).count().get(),
      usersRef.where("directionText", "!=", null).count().get(),
    ]);

    // Retention: users who updated after >1 day from creation
    const allUsers = await usersRef.select("createdAt", "updatedAt").get();
    let retained = 0;
    allUsers.forEach((doc) => {
      const d = doc.data();
      if (d.createdAt && d.updatedAt) {
        const created = new Date(d.createdAt).getTime();
        const updated = new Date(d.updatedAt).getTime();
        if (updated - created > 86400000) retained++;
      }
    });

    // Monthly signups for the last 6 months
    const now = new Date();
    const monthlySignups: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const snap = await usersRef
        .where("createdAt", ">=", start)
        .where("createdAt", "<", end)
        .count()
        .get();
      monthlySignups.push({
        month: d.toLocaleString("default", { month: "short", year: "2-digit" }),
        count: snap.data().count,
      });
    }

    return NextResponse.json({
      totalUsers: totalSnap.data().count,
      completedSignup: onboardedSnap.data().count,
      completedDNA: dnaSnap.data().count,
      generatedDirection: directionSnap.data().count,
      retained,
      monthlySignups,
    });
  } catch (err) {
    console.error("[admin/metrics]", err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
