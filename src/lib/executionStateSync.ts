import { authFetch } from "@/lib/authFetch";

// Prefixes of localStorage keys written by the Execution Hub. These are the
// keys we mirror to Firestore so a user's progress survives logout / new device
// / cleared browser storage.
const SYNCED_PREFIXES = [
  "launchpad-",
  "brand-",
  "business-name",
  "custom-project-names",
  "social-",
  "social-status-",
  "social-priority-",
  "painkiller-",
  "mvo-",
  "pattern-summary-",
  "target-customers-",
  "finance-",
  "mvo-defined-",
  "validate-",
];

function isSyncedKey(key: string): boolean {
  return SYNCED_PREFIXES.some((p) => key.startsWith(p));
}

function collectLocalEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isSyncedKey(key)) {
        const val = localStorage.getItem(key);
        if (val !== null) entries[key] = val;
      }
    }
  } catch { /* ignore */ }
  return entries;
}

let hydrated = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

// Pull server state and merge into localStorage. Server wins for keys it has,
// but local-only keys are preserved (and pushed back). Call once on auth load.
export async function hydrateExecutionState(): Promise<void> {
  if (hydrated) return;
  try {
    const res = await authFetch("/api/execution-projects/state");
    if (!res.ok) return;
    const data = await res.json();
    const remote: Record<string, string> = data?.entries ?? {};
    let changed = false;
    for (const [key, val] of Object.entries(remote)) {
      if (localStorage.getItem(key) !== val) {
        try { localStorage.setItem(key, val); changed = true; } catch { /* ignore */ }
      }
    }
    hydrated = true;
    // If we had local-only keys not on the server, push the merged set up.
    const local = collectLocalEntries();
    if (Object.keys(local).length > Object.keys(remote).length || changed) {
      schedulePush(0);
    }
    // Notify listeners that storage was hydrated so components can re-read.
    if (changed && typeof window !== "undefined") {
      window.dispatchEvent(new Event("execution-state-hydrated"));
    }
  } catch { /* ignore */ }
}

// Debounced push of current local state to the server.
export function schedulePush(delay = 1500): void {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      const entries = collectLocalEntries();
      await authFetch("/api/execution-projects/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
    } catch { /* ignore */ }
  }, delay);
}

// Patch localStorage.setItem/removeItem so any synced-key write schedules a push.
// Idempotent — safe to call multiple times.
let patched = false;
export function installExecutionStateAutosave(): void {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const origSet = localStorage.setItem.bind(localStorage);
  const origRemove = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    origSet(key, value);
    if (isSyncedKey(key)) schedulePush();
  };
  localStorage.removeItem = (key: string) => {
    origRemove(key);
    if (isSyncedKey(key)) schedulePush();
  };
}
