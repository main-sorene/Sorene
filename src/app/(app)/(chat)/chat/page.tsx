"use client";
import { useAtomValue, useSetAtom } from "jotai";
import {
  isAssessmentCompleteAtom,
  isAssessmentInProgressAtom,
  userAtom,
  authLoadingAtom,
  assistantThreadAtom,
  assistantThreadLoadingAtom,
  reEntryMessageAtom,
} from "@/store/atoms";
import { useEffect, useRef } from "react";
import { AssessmentChatPage } from "@/components/assessment/AssessmentChatPage";
import { getAssistantMessages } from "@/lib/firestore";

export default function Page() {
  const user = useAtomValue(userAtom);
  const authLoading = useAtomValue(authLoadingAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const isAssessmentInProgress = useAtomValue(isAssessmentInProgressAtom);
  const assistantThreadLoading = useAtomValue(assistantThreadLoadingAtom);
  const setAssessmentComplete = useSetAtom(isAssessmentCompleteAtom);
  const setThread = useSetAtom(assistantThreadAtom);
  const setThreadLoading = useSetAtom(assistantThreadLoadingAtom);
  const setReEntryMessage = useSetAtom(reEntryMessageAtom);
  const loadedRef = useRef<string | null>(null);

  // Load thread as soon as uid is available — Firestore is the source of truth.
  // If messages exist → returning user (mark assessment complete, load thread).
  // If no messages exist → new user (show AssessmentChatPage).
  useEffect(() => {
    if (!user?.uid || authLoading || loadedRef.current === user.uid) return;
    loadedRef.current = user.uid;
    setThreadLoading(true);
    getAssistantMessages(user.uid, 50)
      .then((messages) => {
        setThread(messages);
        if (messages.length > 0) {
          setAssessmentComplete(true);
        }
      })
      .finally(() => setThreadLoading(false));
  }, [user?.uid, authLoading, setThread, setThreadLoading, setAssessmentComplete]);

  // Fallback: if profile says DNA complete and no active assessment session, mark complete
  useEffect(() => {
    if (user?.profile?.dnaAssessmentComplete && !isAssessmentInProgress) {
      setAssessmentComplete(true);
    }
  }, [user?.profile?.dnaAssessmentComplete, isAssessmentInProgress, setAssessmentComplete]);

  // Re-entry opening: show once per session if user was away 48+ hours
  useEffect(() => {
    if (!user?.uid || !isAssessmentComplete || assistantThreadLoading) return;
    const lastSession = user.profile?.lastSessionAt;
    if (!lastSession) return;
    const hoursSince = (Date.now() - new Date(lastSession).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 48) return;
    const reEntryKey = `re_entry_shown_${user.uid}`;
    if (sessionStorage.getItem(reEntryKey)) return;
    sessionStorage.setItem(reEntryKey, "1");

    import("@/lib/authFetch").then(({ authFetch }) => {
      authFetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/re-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      })
        .then((res) => res.json())
        .then((data: { message?: string }) => {
          if (data.message) setReEntryMessage(data.message);
        })
        .catch((err: unknown) => { console.error("[re-entry]", err); });
    });
  }, [user?.uid, user?.profile?.lastSessionAt, isAssessmentComplete, assistantThreadLoading, setReEntryMessage]);

  if (authLoading) return null;
  if (isAssessmentComplete) return null; // ChatLayout renders ChatArea

  return <AssessmentChatPage />;
}
