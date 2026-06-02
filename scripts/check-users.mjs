import admin from "firebase-admin";
import { readFileSync } from "node:fs";
const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const snap = await admin.firestore().collection("users").get();
let trueCount = 0, falseCount = 0, missingCount = 0;
const sample = [];
for (const doc of snap.docs) {
  const d = doc.data();
  if (d.onboardingComplete === true) trueCount++;
  else if (d.onboardingComplete === false) falseCount++;
  else missingCount++;
  if (sample.length < 5) sample.push({ id: doc.id, onboardingComplete: d.onboardingComplete, dnaAssessmentComplete: d.dnaAssessmentComplete, updatedAt: d.updatedAt });
}
console.log(`onboardingComplete=true: ${trueCount}`);
console.log(`onboardingComplete=false: ${falseCount}`);
console.log(`onboardingComplete missing/other: ${missingCount}`);
console.log("Sample 5:", JSON.stringify(sample, null, 2));
process.exit(0);
