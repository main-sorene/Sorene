import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { sendWhatsApp } from "@/app/api/messaging/whatsapp/webhook/route";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface WhatsAppSettings {
  linkedPhone?: string;
  activeProjectTitle?: string;
  reminder_freq?: string;
  reminder_hour?: number;
  reminder_day?: string;
  knowledge?: string;
  knowledge_hour?: number;
  checkin_prompt?: boolean;
  checkin_hour?: number;
}

interface ExecutionProject {
  title: string;
  oneliner?: string;
  path_label?: string;
}

interface UserProfile {
  firstName?: string;
  occupation?: string;
  dna_narrative?: string;
}

async function getExecutionState(uid: string): Promise<Record<string, string>> {
  try {
    const snap = await getAdminFirestore()
      .collection("users").doc(uid)
      .collection("executionState").doc("hub")
      .get();
    return snap.data()?.entries ?? {};
  } catch {
    return {};
  }
}

async function handleUser(
  uid: string,
  phone: string,
  settings: WhatsAppSettings,
  projects: ExecutionProject[],
  profile: UserProfile,
  utcHour: number,
  utcDay: string
) {
  const activeProject = settings.activeProjectTitle
    ? projects.find((p) => p.title === settings.activeProjectTitle) ?? null
    : null;

  const name = profile.firstName ?? "";
  const projectName = activeProject?.title ?? "your business";
  const namePrefix = name ? `${name}, ` : "";

  // Business update reminder
  const reminderDue =
    (settings.reminder_freq === "Daily" && settings.reminder_hour === utcHour) ||
    (settings.reminder_freq === "Weekly" && settings.reminder_day === utcDay && settings.reminder_hour === utcHour);

  if (reminderDue) {
    const stage = activeProject?.path_label ?? "";
    let msg = `${namePrefix}quick check-in on ${projectName}.`;
    if (stage === "validation" || stage?.includes("validat")) {
      msg += " How many customer conversations have you had this week? What's the most surprising thing you heard?";
    } else if (stage === "launchpad" || stage?.includes("launch")) {
      msg += " What's the one thing you moved forward this week — and what's still blocking you?";
    } else if (stage === "growth" || stage?.includes("growth")) {
      msg += " What's your key metric looking like this week? What's working and what needs a change?";
    } else {
      msg += " What's the biggest thing you moved forward this week — and what's the one thing still blocking you?";
    }
    await sendWhatsApp(phone, msg);
  }

  // Business knowledge snippet
  if (settings.knowledge === "Daily" && settings.knowledge_hour === utcHour) {
    try {
      const profileContext = [
        profile.occupation ? `Occupation: ${profile.occupation}` : "",
        profile.dna_narrative ? `Entrepreneurial profile: ${profile.dna_narrative.slice(0, 250)}` : "",
        activeProject ? `Building: ${activeProject.title}${activeProject.oneliner ? ` — ${activeProject.oneliner}` : ""}` : "",
        activeProject?.path_label ? `Stage: ${activeProject.path_label}` : "",
      ].filter(Boolean).join(". ");

      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        system: `You are Sorene, a sharp execution coach. Write a single insight for a founder — under 50 words, no markdown, no intro phrase like "Here's a tip". Just the insight itself. Make it specific to their context, not generic. Sound like a smart friend, not a LinkedIn post.`,
        messages: [{
          role: "user",
          content: `Write one insight for this founder: ${profileContext}. Make it directly relevant to where they are right now.`,
        }],
      });

      const tip = res.content[0].type === "text" ? res.content[0].text.trim() : "";
      if (tip) {
        const intro = name ? `${name} —` : "Today's insight:";
        await sendWhatsApp(phone, `${intro}\n\n${tip}`);
      }
    } catch (err) {
      console.error("[cron knowledge snippet]", err);
    }
  }

  // Accountability check-in
  if (settings.checkin_prompt && settings.checkin_hour === utcHour) {
    try {
      const state = await getExecutionState(uid);

      // Find incomplete launchpad tasks
      const incomplete: string[] = [];
      for (const [k, v] of Object.entries(state)) {
        if (k.includes("launchpad-status-") && v !== "done") {
          const label = k
            .replace(`launchpad-status-`, "")
            .replace(/-/g, " ")
            .replace(new RegExp(`-${activeProject?.title ?? ""}$`), "")
            .trim();
          if (label) incomplete.push(label);
        }
      }

      const top3 = incomplete.slice(0, 3);
      if (top3.length > 0) {
        const taskList = top3.map((t, i) => `${i + 1}. ${t}`).join("\n");
        const msg = `${namePrefix}here's what's still open on ${projectName}:\n\n${taskList}\n\nPick one. Reply if you need a hand with any of them.`;
        await sendWhatsApp(phone, msg);
      } else {
        // All caught up — send a forward-looking nudge
        const msg = `${namePrefix}looks like you're all caught up on ${projectName}. What's the next thing you're going to move forward today?`;
        await sendWhatsApp(phone, msg);
      }
    } catch (err) {
      console.error("[cron checkin]", err);
    }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDay = DAY_NAMES[now.getUTCDay()];

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection("users")
      .where("linkedMessaging.whatsapp", "!=", null)
      .get();

    await Promise.all(usersSnap.docs.map(async (doc) => {
      try {
        const data = doc.data();
        const linkedPhone = data.linkedMessaging?.whatsapp as string | undefined;
        if (!linkedPhone) return;

        const settings: WhatsAppSettings = data.whatsappSettings ?? {};
        const phone = settings.linkedPhone ?? linkedPhone;
        const projects: ExecutionProject[] = data.executionProjects ?? [];
        const profile: UserProfile = data.profile ?? {};

        await handleUser(doc.id, phone, settings, projects, profile, utcHour, utcDay);
      } catch (err) {
        console.error(`[cron] error for user ${doc.id}:`, err);
      }
    }));

    return Response.json({ ok: true, processed: usersSnap.size, hour: utcHour, day: utcDay });
  } catch (err) {
    console.error("[cron whatsapp-scheduled]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
