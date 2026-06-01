import { useAtomValue, useSetAtom } from "jotai";
import {
  activeConversationIdAtom,
  isAssessmentCompleteAtom,
  conversationsAtom,
} from "@/store/atoms";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const setActiveId = useSetAtom(activeConversationIdAtom);
  const isAssessmentComplete = useAtomValue(isAssessmentCompleteAtom);
  const conversations = useAtomValue(conversationsAtom);
  const navigate = useNavigate();

  useEffect(() => {
    // If assessment is not complete and we have existing conversations,
    // redirect to the most recent one instead of allowing a new chat.
    if (!isAssessmentComplete && conversations.length > 0) {
      const latestConv = conversations[0];
      navigate(`/chat/${latestConv.id}`, { replace: true });
    } else {
      setActiveId(null);
    }
  }, [setActiveId, isAssessmentComplete, conversations, navigate]);

  return null;
}
