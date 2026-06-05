import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const email = "pamela.nguyenduong@gmail.com";

async function fixName() {
  const ref = db.collection("users").doc(email);
  const doc = await ref.get();
  if (!doc.exists) { console.log("User not found:", email); return; }

  const d = doc.data();
  console.log("Current firstName:", d.firstName);
  console.log("Current lastName:", d.lastName);
  console.log("cvSummary start:", (d.cvSummary || "").slice(0, 200));

  // Try to extract name from cvSummary first line
  const firstLine = (d.cvSummary || "").split("\n")[0].trim();
  const parts = firstLine.split(/\s+/).filter(Boolean);
  let firstName = "", lastName = "";
  if (parts.length >= 2 && parts.length <= 5) {
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  if (!firstName) {
    // Fall back to displayName or email prefix
    const displayName = d.displayName || "";
    const nameParts = displayName.trim().split(/\s+/);
    firstName = nameParts[0] || "Pamela";
    lastName = nameParts.slice(1).join(" ") || "Nguyen Duong";
    console.log("⚠️  cvSummary name not found — using fallback:", firstName, lastName);
  }

  console.log("\nWill update to firstName:", firstName, "lastName:", lastName);
  await ref.update({ firstName, lastName });
  console.log("✅ Done");
}

fixName().catch(console.error);
