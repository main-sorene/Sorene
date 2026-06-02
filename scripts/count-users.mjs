import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const fsSnap = await admin.firestore().collection("users").get();
console.log(`Firestore "users" docs: ${fsSnap.size}`);

let authTotal = 0;
let pageToken;
do {
  const res = await admin.auth().listUsers(1000, pageToken);
  authTotal += res.users.length;
  pageToken = res.pageToken;
} while (pageToken);
console.log(`Firebase Auth accounts: ${authTotal}`);

const fsUids = new Set(fsSnap.docs.map((d) => d.id));
let withProfile = 0;
pageToken = undefined;
do {
  const res = await admin.auth().listUsers(1000, pageToken);
  for (const u of res.users) if (fsUids.has(u.uid)) withProfile++;
  pageToken = res.pageToken;
} while (pageToken);
console.log(`Auth users WITH Firestore profile: ${withProfile}`);
console.log(`Auth users WITHOUT Firestore profile: ${authTotal - withProfile}`);

process.exit(0);
