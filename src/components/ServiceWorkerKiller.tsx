"use client";
import { useEffect } from "react";

// Guards against reload loops — we only force one reload per browser session
// after actually clearing a stale service worker / cache.
const RELOAD_FLAG = "sw_purged_reload";

export function ServiceWorkerKiller() {
  useEffect(() => {
    let didClear = false;

    const run = async () => {
      try {
        // 1. Unregister any previously-installed service workers.
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            const ok = await reg.unregister();
            if (ok) didClear = true;
          }
        }

        // 2. Delete all Cache Storage entries. Unregistering a SW does NOT
        //    clear the caches it populated, so a stale bundle keeps being
        //    served until these are removed.
        if ("caches" in window) {
          const keys = await caches.keys();
          if (keys.length > 0) didClear = true;
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* best-effort */
      }

      // 3. If we removed something stale, reload once so the fresh assets load.
      if (didClear && !sessionStorage.getItem(RELOAD_FLAG)) {
        try { sessionStorage.setItem(RELOAD_FLAG, "1"); } catch {}
        window.location.reload();
      }
    };

    run();
  }, []);
  return null;
}
