import admin from "firebase-admin";
import { readFileSync } from "node:fs";
const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const snap = await admin.firestore().collection("users").get();
let trueCount = 0, falseCount = 0;
const trueUsers = [];
for (const doc of snap.docs) {
  const d = doc.data();
  if (d.onboardingComplete === true) { trueCount++; trueUsers.push({ id: doc.id, name: `${d.firstName||""} ${d.lastName||""}`.trim(), updatedAt: d.updatedAt }); }
  else falseCount++;
}
console.log(`onboardingComplete=true: ${trueCount}`);
console.log(`onboardingComplete=false: ${falseCount}`);
console.log("Users still TRUE:", JSON.stringify(trueUsers, null, 2));
process.exit(0);
