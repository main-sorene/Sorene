import admin from "firebase-admin";
import { readFileSync } from "node:fs";
const sa = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const auth = admin.auth();

const emails = [
  "pamela.nguyenduong@gmail.com",
  "thecirclemarketing001@gmail.com",
  "sorene.ai001@gmail.com",
];

for (const email of emails) {
  console.log(`\n=== ${email} ===`);

  // Check doc by email key
  const byEmail = await db.collection("users").doc(email).get();
  console.log(`  Doc by EMAIL key: ${byEmail.exists ? `onboardingComplete=${byEmail.data().onboardingComplete}` : "NOT FOUND"}`);

  // Get Firebase Auth UID
  try {
    const user = await auth.getUserByEmail(email);
    console.log(`  Firebase Auth UID: ${user.uid}`);

    // Check doc by UID key
    const byUid = await db.collection("users").doc(user.uid).get();
    console.log(`  Doc by UID key: ${byUid.exists ? `onboardingComplete=${byUid.data().onboardingComplete}` : "NOT FOUND"}`);
  } catch(e) {
    console.log(`  Firebase Auth: NOT FOUND (${e.message})`);
  }
}
process.exit(0);
