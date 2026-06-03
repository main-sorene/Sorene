import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebaseAdmin";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ADMIN_SECRET = process.env.ADMIN_SECRET || "sorene-admin-2024";

async function generateNarrative(answers: Record<string, string>, cvSummary?: string): Promise<Record<string, string>> {
  const answersBlock = Object.entries(answers).map(([k, v]) => `${k}: "${v}"`).join("\n");

  const prompt = `You are Sorene, a warm and perceptive entrepreneurship coach. Based on the assessment answers below${cvSummary ? " and their background" : ""}, generate a rich DNA profile narrative.

${cvSummary ? `Their background:\n${cvSummary}\n\n` : ""}Assessment answers:
${answersBlock}

Generate EXACTLY 7 sections, each separated by "---SECTION---". Each section: TITLE line, blank line, content.

1. core_dna_label — 3-5 word identity naming their #1 entrepreneurial strength. Specific and ownable. NOT generic (no "Visionary", "Leader", "Creative"). Name the actual pattern you see. Example: "The Precision-Driven Builder", "The Mission-First Operator".

2. your_core — 3 sentences: (1) name the strongest entrepreneurial signal across all answers, (2) echo their exact words, (3) what this means for the kind of venture that will work for them.

3. what_drives_you — 2-3 sentences on their deepest motivation and what success would actually feel like. Pull from their words.

4. how_you_work — 2-3 sentences on their ideal environment, pace, collaboration style. Be specific and human.

5. risk_and_change — 2-3 sentences on their relationship with risk. Name the specific trade-off they mentioned.

6. your_energy — 2-3 sentences on what energizes and drains them. Be vivid.

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

  const block = message.content[0];
  const raw = block && block.type === "text" ? block.text.trim() : "";
  const narrative: Record<string, string> = {};
  for (const section of raw.split("---SECTION---").map((s) => s.trim()).filter(Boolean)) {
    const lines = section.split("\n");
    const m = lines[0]?.match(/^TITLE:\s*(\S+)/);
    if (m) narrative[m[1].trim()] = lines.slice(1).join("\n").trim();
  }
  return narrative;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.secret !== ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure admin app is initialized
  getAdminAuth();
  const apps = getApps();
  if (!apps.length) {
    return Response.json({ error: "Firebase admin not initialized" }, { status: 500 });
  }

  const db = getFirestore(getApp());
  const usersSnap = await db.collection("users").get();
  const results: { uid: string; status: string }[] = [];

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const uid = userDoc.id;

    if (!data.dnaAssessmentComplete || !data.assessmentAnswers) {
      results.push({ uid, status: "skipped (no assessment)" });
      continue;
    }

    if (data.dna_narrative?.core_dna_label) {
      results.push({ uid, status: `skipped (already has: ${data.dna_narrative.core_dna_label})` });
      continue;
    }

    try {
      const narrative = await generateNarrative(data.assessmentAnswers, data.cvSummary);
      if (narrative.core_dna_label) {
        await db.collection("users").doc(uid).set({ dna_narrative: narrative }, { merge: true });
        results.push({ uid, status: `✓ ${narrative.core_dna_label}` });
      } else {
        results.push({ uid, status: "failed — no label generated" });
      }
    } catch (err) {
      results.push({ uid, status: `error: ${String(err)}` });
    }
  }

  return Response.json({ total: usersSnap.size, results });
}
