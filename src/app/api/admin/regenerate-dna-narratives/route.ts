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

  const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
  const narrative: Record<string, string> = {};
  for (const section of raw.split(/---SECTION---|---section---/).map((s) => s.trim()).filter(Boolean)) {
    const lines = section.split("\n").filter(l => l.trim() !== "");
    // Match "TITLE: key" anywhere in the first few lines
    let titleKey = "";
    let contentStartIdx = 0;
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const m = lines[i].match(/TITLE:\s*(\w+)/i);
      if (m) { titleKey = m[1].trim(); contentStartIdx = i + 1; break; }
    }
    if (titleKey) {
      narrative[titleKey] = lines.slice(contentStartIdx).join("\n").trim();
    }
  }
  // Log for debugging
  if (!narrative.core_dna_label) {
    console.error("[dna-narrative] parse failed, raw:", raw.slice(0, 500));
  }
  return narrative;
}

async function runRegeneration() {
  getAdminAuth(); // ensures Firebase Admin is initialized
  if (!getApps().length) {
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
    if (data.dna_narrative?.core_dna_label && data.dna_narrative?.your_core) {
      results.push({ uid, status: `skipped — already has: ${data.dna_narrative.core_dna_label}` });
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

// GET: open in browser — https://sorene.ai/api/admin/regenerate-dna-narratives?secret=sorene-admin-2024
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("secret") !== ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runRegeneration();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.secret !== ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runRegeneration();
}
