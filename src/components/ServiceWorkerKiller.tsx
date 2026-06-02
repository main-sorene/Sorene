"use client";
import { useEffect } from "react";

export function ServiceWorkerKiller() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
    }
  }, []);
  return null;
}
