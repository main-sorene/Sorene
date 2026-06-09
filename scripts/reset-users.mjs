import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

const snap = await db.collection("users").get();
console.log(`Found ${snap.size} users.`);

let batch = db.batch();
let ops = 0;
let total = 0;

for (const doc of snap.docs) {
  batch.update(doc.ref, {
    onboardingComplete: false,
    dnaAssessmentComplete: false,
  });
  ops++;
  total++;
  if (ops === 400) {
    await batch.commit();
    batch = db.batch();
    ops = 0;
  }
}
if (ops > 0) await batch.commit();

console.log(`Reset ${total} users (onboardingComplete=false, dnaAssessmentComplete=false).`);
process.exit(0);
