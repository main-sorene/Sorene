/**
 * fix-yes-name-bug.mjs
 *
 * Finds users whose firstName/lastName was incorrectly set to the button text
 * "Yes, that's correct" (split into firstName="Yes," lastName="that's correct")
 * due to the onb_confirm_name bug, and restores their real name from their CV data.
 *
 * Usage:
 *   node scripts/fix-yes-name-bug.mjs             # dry run (no writes)
 *   node scripts/fix-yes-name-bug.mjs --fix        # apply fixes
 */

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const DRY_RUN = !process.argv.includes("--fix");
if (DRY_RUN) console.log("DRY RUN — pass --fix to apply changes\n");

const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snap = await db.collection("users").get();

const BUGGY_FIRST = /^yes[,.]?\s*$/i;
const BUGGY_LAST  = /^that'?s\s+correct\s*$/i;

let checked = 0, matched = 0, fixed = 0;

for (const doc of snap.docs) {
  checked++;
  const d = doc.data();
  const firstName = d.firstName || "";
  const lastName  = d.lastName  || "";

  const isBuggy = BUGGY_FIRST.test(firstName) && BUGGY_LAST.test(lastName);
  if (!isBuggy) continue;

  matched++;

  // Try to recover the real name from cvSummary or cvData
  // cvSummary is a text blob — look for a name line at the top
  let realFirst = "", realLast = "";
  const cvSummary = d.cvSummary || "";
  // Many CV summaries start with the person's name on the first line
  const firstLine = cvSummary.split("\n")[0].trim();
  const nameParts = firstLine.split(/\s+/).filter(Boolean);
  if (nameParts.length >= 2 && nameParts.length <= 4) {
    realFirst = nameParts[0];
    realLast  = nameParts.slice(1).join(" ");
  }

  console.log(`\nUser ${doc.id}`);
  console.log(`  Buggy name: "${firstName}" "${lastName}"`);
  console.log(`  Recovered:  "${realFirst}" "${realLast}" (from cvSummary first line: "${firstLine}")`);
  console.log(`  email: ${d.email || "(no email field)"}`);

  if (!realFirst) {
    console.log("  ⚠️  Could not recover name — skipping (manual fix needed)");
    continue;
  }

  if (!DRY_RUN) {
    await db.collection("users").doc(doc.id).update({
      firstName: realFirst,
      lastName: realLast,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    fixed++;
    console.log("  ✅ Fixed");
  } else {
    console.log("  → Would update to:", realFirst, realLast);
  }
}

console.log(`\nDone. Checked: ${checked}, Matched buggy: ${matched}, Fixed: ${fixed}`);
process.exit(0);
