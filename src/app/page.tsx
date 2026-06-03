"use client";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { userAtom, authLoadingAtom } from "@/store/atoms";
import { useRouter } from "next/navigation";
import { LandingPageScreen } from "@/pages-gitlab/LandingPage";
import { auth } from "@/lib/firebase";

export default function Page() {
  const authUser = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const router = useRouter();
  const [debugLog, setDebugLog] = useState<string[]>(["page loaded"]);

  const addLog = (msg: string) => setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  useEffect(() => {
    addLog(`authLoading=${authLoading}, authUser=${authUser ? authUser.uid : "null"}`);
    if (authLoading) return;
    if (!authUser) {
      addLog("no user, staying on landing");
      return;
    }
    if (authUser.profile?.onboardingComplete) {
      addLog("redirecting to /chat");
      router.replace("/chat");
    } else {
      addLog("redirecting to /onBoarding");
      router.replace("/onBoarding");
    }
  }, [authLoading, authUser, router]);

  useEffect(() => {
    addLog(`firebase auth currentUser=${auth?.currentUser?.email || "null"}`);
    addLog(`authDomain=${auth?.config?.authDomain || "unknown"}`);
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <DebugPanel logs={debugLog} />
      </div>
    );
  }

  return (
    <>
      <LandingPageScreen />
      {/* Temporary debug overlay — remove after fixing mobile auth */}
      <DebugPanel logs={debugLog} />
    </>
  );
}

function DebugPanel({ logs }: { logs: string[] }) {
  const [allLogs, setAllLogs] = useState<string[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      const authLogs: string[] = (window as any).__authDebug || [];
      setAllLogs([...authLogs, ...logs]);
    }, 500);
    return () => clearInterval(id);
  }, [logs]);
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-green-400 text-xs p-3 max-h-48 overflow-y-auto z-[9999] font-mono">
      {allLogs.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}
