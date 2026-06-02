import admin from "firebase-admin";
import { readFileSync } from "node:fs";
const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const emails = [
  "pamela.nguyenduong@gmail.com",
  "thecirclemarketing001@gmail.com",
  "sorene.ai001@gmail.com",
  "reigniteafterlayoff@gmail.com",
];
for (const email of emails) {
  const doc = await db.collection("users").doc(email).get();
  if (!doc.exists) {
    console.log(`\n${email}: NO DOC`);
    continue;
  }
  const d = doc.data();
  console.log(`\n${email}:`);
  console.log(`  onboardingComplete: ${d.onboardingComplete}`);
  console.log(`  dnaAssessmentComplete: ${d.dnaAssessmentComplete}`);
  console.log(`  updatedAt: ${d.updatedAt}`);
  console.log(`  createdAt: ${d.createdAt}`);
  console.log(`  has assessmentAnswers: ${!!d.assessmentAnswers}`);
}
process.exit(0);
