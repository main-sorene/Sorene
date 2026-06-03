import { NextRequest } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { verifyAuth } from "@/lib/firebaseAdmin";

// One-time admin endpoint to reset all users to pre-onboarding state
export async function POST(req: NextRequest) {
  // Only allow authenticated requests
  const user = await verifyAuth(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get admin Firestore
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return Response.json({ error: "Admin SDK not configured" }, { status: 500 });
    }

    const db = getFirestore();
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    let count = 0;
    const batch = db.batch();

    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        onboardingComplete: false,
        dnaAssessmentComplete: false,
        assessmentAnswers: null,
        dnaScores: null,
        directionText: null,
        directionAlternatives: null,
        cvData: null,
        cvSummary: null,
      });
      count++;
    });

    await batch.commit();

    return Response.json({ success: true, usersReset: count });
  } catch (e: any) {
    console.error("Reset error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
