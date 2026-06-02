import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const email = "pamela.nguyenduong@gmail.com";

async function resetUser() {
  const ref = db.collection("users").doc(email);
  const doc = await ref.get();
  if (!doc.exists) {
    console.log("User not found:", email);
    return;
  }
  await ref.update({
    onboardingComplete: false,
    dnaAssessmentComplete: false,
    assessmentAnswers: null,
    directionText: null,
    dnaScores: null,
  });
  console.log("✓ Reset complete for", email);
}

resetUser().catch(console.error);
