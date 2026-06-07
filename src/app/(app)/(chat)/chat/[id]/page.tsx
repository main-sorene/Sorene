"use client";
import { useAtomValue } from "jotai";
import { conversationsAtom } from "@/store/atoms";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatPage } from "@/pages-gitlab/ChatPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const conversations = useAtomValue(conversationsAtom);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const conv = conversations.find((c) => c.id === id);
    // Redirect backend-only chats (no local data) to DNA section
    if (conv?.isCreatedOnBackend === true) {
      router.replace("/dna");
    }
  }, [id, conversations, router]);

  return <ChatPage />;
}
