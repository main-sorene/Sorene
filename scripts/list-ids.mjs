import admin from "firebase-admin";
import { readFileSync } from "node:fs";
const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// List actual Firestore doc IDs to see what key is being used
const snap = await admin.firestore().collection("users").limit(10).get();
console.log("Firestore doc IDs (first 10):");
for (const doc of snap.docs) {
  const d = doc.data();
  console.log(`  "${doc.id}" → onboardingComplete=${d.onboardingComplete}, email=${d.email}`);
}
process.exit(0);
