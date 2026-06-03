/**
 * Run: FIREBASE_SERVICE_ACCOUNT_KEY='...' ANTHROPIC_API_KEY='...' node scripts/regenerate-dna-narratives.mjs
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccount) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env var");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY env var");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateNarrative(answers, cvSummary) {
  const answersBlock = Object.entries(answers).map(([k, v]) => `${k}: "${v}"`).join("\n");
  const prompt = `You are Sorene, a warm and perceptive entrepreneurship coach. Based on the assessment answers below${cvSummary ? " and their background" : ""}, generate a rich DNA profile narrative.

${cvSummary ? `Their background:\n${cvSummary}\n\n` : ""}Assessment answers:
${answersBlock}

Generate EXACTLY 7 sections, each separated by "---SECTION---". Each section: TITLE line, blank line, content.

1. core_dna_label — 3-5 word identity naming their #1 entrepreneurial strength. Specific and ownable. NOT generic (no "Visionary", "Leader", "Creative"). Name the actual pattern you see.

2. your_core — 3 sentences: (1) strongest entrepreneurial signal, (2) echo their exact words, (3) what this means for the right kind of venture.

3. what_drives_you — 2-3 sentences on deepest motivation and what success feels like.

4. how_you_work — 2-3 sentences on ideal environment, pace, collaboration style.

5. risk_and_change — 2-3 sentences on relationship with risk and the key trade-off they named.

6. your_energy — 2-3 sentences on what energizes and drains them.

7. strengths_and_edges — 2-3 sentences on real strengths and non-negotiables. End with an honest limit.

Rules: Second person. Specific. Warm but honest. No bullets. No filler phrases.

Output:
TITLE: core_dna_label

[3-5 words]
---SECTION---
TITLE: your_core

[3 sentences]
---SECTION---
TITLE: what_drives_you

[2-3 sentences]
---SECTION---
TITLE: how_you_work

[2-3 sentences]
---SECTION---
TITLE: risk_and_change

[2-3 sentences]
---SECTION---
TITLE: your_energy

[2-3 sentences]
---SECTION---
TITLE: strengths_and_edges

[2-3 sentences]`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1400,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0]?.text?.trim() ?? "";
  const narrative = {};
  for (const section of raw.split("---SECTION---").map(s => s.trim()).filter(Boolean)) {
    const lines = section.split("\n");
    const m = lines[0]?.match(/^TITLE:\s*(\S+)/);
    if (m) narrative[m[1].trim()] = lines.slice(1).join("\n").trim();
  }
  return narrative;
}

async function main() {
  const snap = await db.collection("users").get();
  console.log(`Found ${snap.size} users`);

  for (const userDoc of snap.docs) {
    const data = userDoc.data();
    const uid = userDoc.id;

    if (!data.dnaAssessmentComplete || !data.assessmentAnswers) {
      console.log(`[skip] ${uid} — no assessment`);
      continue;
    }
    if (data.dna_narrative?.core_dna_label) {
      console.log(`[skip] ${uid} — already has: ${data.dna_narrative.core_dna_label}`);
      continue;
    }

    console.log(`[generating] ${uid}...`);
    try {
      const narrative = await generateNarrative(data.assessmentAnswers, data.cvSummary);
      if (narrative.core_dna_label) {
        await db.collection("users").doc(uid).set({ dna_narrative: narrative }, { merge: true });
        console.log(`[✓] ${uid} — ${narrative.core_dna_label}`);
      } else {
        console.log(`[fail] ${uid} — no label generated`);
      }
    } catch (err) {
      console.error(`[error] ${uid}:`, err.message);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main();
