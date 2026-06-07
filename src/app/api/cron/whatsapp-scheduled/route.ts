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
  description?: string;
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
  linkedPhone: string,
  settings: WhatsAppSettings,
  projects: ExecutionProject[],
  profile: UserProfile,
  utcHour: number,
  utcDay: string
) {
  const activeProject = settings.activeProjectTitle
    ? projects.find((p) => p.title === settings.activeProjectTitle) ?? null
    : null;

  // Business update reminder
  if (settings.reminder_freq === "Daily" && settings.reminder_hour === utcHour) {
    const projectName = activeProject?.title ?? "your business";
    await sendWhatsApp(linkedPhone,
      `👋 Time for your business update! How is ${projectName} going? Share a quick update — wins, blockers, or next steps.`
    );
  } else if (settings.reminder_freq === "Weekly" && settings.reminder_day === utcDay && settings.reminder_hour === utcHour) {
    const projectName = activeProject?.title ?? "your business";
    await sendWhatsApp(linkedPhone,
      `👋 Time for your business update! How is ${projectName} going? Share a quick update — wins, blockers, or next steps.`
    );
  }

  // Business knowledge snippet
  if (settings.knowledge === "Daily" && settings.knowledge_hour === utcHour) {
    try {
      const profileSummary = [
        profile.firstName ? `Name: ${profile.firstName}` : "",
        profile.occupation ? `Occupation: ${profile.occupation}` : "",
        profile.dna_narrative ? `Profile: ${profile.dna_narrative.slice(0, 200)}` : "",
        activeProject ? `Project: ${activeProject.title}${activeProject.oneliner ? ` — ${activeProject.oneliner}` : ""}` : "",
        activeProject?.path_label ? `Stage: ${activeProject.path_label}` : "",
      ].filter(Boolean).join(". ");

      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        system: "You are a business coach. Generate a single actionable business insight in under 50 words. No markdown, no headers, just the tip.",
        messages: [{
          role: "user",
          content: `Generate a business insight or tip relevant to someone with this profile and project: ${profileSummary}. Focus on the ${activeProject?.path_label ?? "early-stage"} stage. Be specific and actionable.`,
        }],
      });
      const tip = res.content[0].type === "text" ? res.content[0].text : "";
      if (tip) {
        await sendWhatsApp(linkedPhone, `💡 Daily insight:\n\n${tip}`);
      }
    } catch (err) {
      console.error("[cron knowledge snippet]", err);
    }
  }

  // Accountability check-in
  if (settings.checkin_prompt && settings.checkin_hour === utcHour) {
    try {
      const state = await getExecutionState(uid);
      // Find incomplete launchpad tasks — keys with launchpad_ prefix that are not "complete"
      const incomplete: string[] = [];
      for (const [k, v] of Object.entries(state)) {
        if (k.includes("launchpad_") && v !== "complete" && v !== "done" && v !== "true") {
          // Format key nicely
          const label = k.replace(/launchpad_/g, "").replace(/_/g, " ");
          incomplete.push(label);
        }
      }
      const top3 = incomplete.slice(0, 3);
      const taskList = top3.length > 0
        ? top3.map((t, i) => `${i + 1}. ${t}`).join("\n")
        : "No open tasks found — you're all caught up!";
      await sendWhatsApp(linkedPhone,
        `📋 Your tasks for today:\n\n${taskList}\n\nReply when done or if you need help with any of them.`
      );
    } catch (err) {
      console.error("[cron checkin]", err);
    }
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcDay = DAY_NAMES[now.getUTCDay()];

  try {
    // Query users with a linkedMessaging.whatsapp phone number
    const db = getAdminFirestore();
    const usersSnap = await db.collection("users")
      .where("linkedMessaging.whatsapp", "!=", null)
      .get();

    const promises = usersSnap.docs.map(async (doc) => {
      try {
        const data = doc.data();
        const linkedPhone = data.linkedMessaging?.whatsapp as string | undefined;
        if (!linkedPhone) return;

        const settings: WhatsAppSettings = data.whatsappSettings ?? {};
        // Also check settings.linkedPhone as fallback
        const phone = settings.linkedPhone ?? linkedPhone;

        const projects: ExecutionProject[] = data.executionProjects ?? [];
        const profile: UserProfile = data.profile ?? {};

        await handleUser(doc.id, phone, settings, projects, profile, utcHour, utcDay);
      } catch (err) {
        console.error(`[cron] error for user ${doc.id}:`, err);
      }
    });

    await Promise.all(promises);
    return Response.json({ ok: true, processed: usersSnap.size, hour: utcHour, day: utcDay });
  } catch (err) {
    console.error("[cron whatsapp-scheduled]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
